use std::net::SocketAddr;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;

use axum::{
    routing::{delete, get, patch, post},
    Router,
};
use tower_governor::{governor::GovernorConfigBuilder, GovernorLayer};
use tower_http::cors::{Any, CorsLayer};
use tower_http::services::ServeDir;
use tower_http::trace::TraceLayer;

use backend::config::Config;
use backend::routes;
use backend::{db, AppState};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info,backend=debug".into()),
        )
        .init();

    let cfg = Config::from_env()?;
    let pool = db::init_pool(&cfg.database_url).await?;

    sqlx::migrate!("./migrations").run(&pool).await?;
    tracing::info!("migrations applied");

    {
        let admin_email = std::env::var("ADMIN_EMAIL").unwrap_or_else(|_| "admin@repka.kg".to_string());
        let admin_password = std::env::var("ADMIN_PASSWORD").unwrap_or_else(|_| "admin123".to_string());
        let svc = backend::services::admin_service::AdminService::new(
            pool.clone(),
            std::sync::Arc::new(cfg.clone()),
        );
        if let Err(e) = svc.ensure_default_admin(&admin_email, &admin_password).await {
            tracing::warn!(error = %e, "failed to ensure default admin");
        }
    }

    let upload_dir = std::env::var("UPLOAD_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("./uploads"));
    tokio::fs::create_dir_all(&upload_dir).await?;
    tracing::info!(upload_dir = %upload_dir.display(), "upload directory ready");

    let state = AppState {
        pool,
        config: Arc::new(cfg.clone()),
        upload_dir: Arc::new(upload_dir.clone()),
    };

    let origins: Vec<http::HeaderValue> = cfg
        .cors_origin
        .split(',')
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .filter_map(|s| s.parse::<http::HeaderValue>().ok())
        .collect();
    tracing::info!(?origins, "configured CORS origins");
    let cors = CorsLayer::new()
        .allow_origin(origins)
        .allow_methods(Any)
        .allow_headers(Any);

    // ~5/min: 5 burst, 1 token / 12s
    let auth_governor = Arc::new(
        GovernorConfigBuilder::default()
            .per_second(12)
            .burst_size(5)
            .finish()
            .unwrap(),
    );
    // ~10/min: 10 burst, 1 token / 6s
    let reveal_governor = Arc::new(
        GovernorConfigBuilder::default()
            .per_second(6)
            .burst_size(10)
            .finish()
            .unwrap(),
    );
    // ~30/min: 30 burst, 1 token / 2s
    let click_governor = Arc::new(
        GovernorConfigBuilder::default()
            .per_second(2)
            .burst_size(30)
            .finish()
            .unwrap(),
    );
    for limiter_arc in [&auth_governor, &reveal_governor, &click_governor] {
        let limiter = limiter_arc.limiter().clone();
        tokio::spawn(async move {
            loop {
                tokio::time::sleep(Duration::from_secs(60)).await;
                limiter.retain_recent();
            }
        });
    }

    let limited_auth = Router::new()
        .route("/login", post(routes::auth::login))
        .route("/forgot-password", post(routes::auth::forgot_password))
        .layer(GovernorLayer {
            config: auth_governor,
        });

    let auth_routes = Router::new()
        .route("/register", post(routes::auth::register))
        .route("/refresh", post(routes::auth::refresh))
        .route("/logout", post(routes::auth::logout))
        .route("/me", get(routes::auth::me))
        .route("/change-password", post(routes::auth::change_password))
        .route("/reset-password", post(routes::auth::reset_password))
        .route("/sessions", get(routes::auth::list_sessions))
        .route("/sessions/:id", delete(routes::auth::revoke_session))
        .route("/account/delete", post(routes::auth::delete_account))
        .merge(limited_auth);

    let reveal_routes = Router::new()
        .route(
            "/:slug/reveal-contacts",
            post(routes::analytics::reveal_contacts),
        )
        .layer(GovernorLayer {
            config: reveal_governor,
        });

    let click_routes = Router::new()
        .route(
            "/:slug/contact-click",
            post(routes::analytics::contact_click),
        )
        .layer(GovernorLayer {
            config: click_governor,
        });

    let tutor_routes = Router::new()
        .route("/", get(routes::tutors::list))
        .route(
            "/me",
            post(routes::tutors::create_me)
                .get(routes::tutors::get_me)
                .patch(routes::tutors::update_me),
        )
        .route("/me/contacts", patch(routes::tutors::update_contacts))
        .route("/me/prices", patch(routes::tutors::update_prices))
        .route("/me/education", post(routes::tutors::add_education))
        .route(
            "/me/education/:id",
            delete(routes::tutors::delete_education),
        )
        .route("/me/experience", post(routes::tutors::add_experience))
        .route(
            "/me/experience/:id",
            delete(routes::tutors::delete_experience),
        )
        .route(
            "/me/submit-for-review",
            post(routes::tutors::submit_for_review),
        )
        .route(
            "/me/photo",
            post(routes::tutors::upload_photo).layer(routes::tutors::photo_body_limit()),
        )
        .route(
            "/me/documents",
            post(routes::tutors::upload_document).layer(routes::tutors::doc_body_limit()),
        )
        .route(
            "/me/documents/:id",
            delete(routes::tutors::delete_document),
        )
        .route(
            "/me/analytics/overview",
            get(routes::analytics::overview),
        )
        .route("/me/analytics/views", get(routes::analytics::views))
        .route(
            "/me/analytics/contact-clicks",
            get(routes::analytics::contact_clicks),
        )
        .route(
            "/me/analytics/sources",
            get(routes::analytics::sources),
        )
        .route(
            "/me/analytics/recent-events",
            get(routes::analytics::recent_events),
        )
        .route("/me/dashboard", get(routes::analytics::dashboard))
        .route("/:slug", get(routes::tutors::get_by_slug))
        .route("/:slug/similar", get(routes::tutors::similar))
        .merge(reveal_routes)
        .merge(click_routes);

    let dict_routes = Router::new()
        .route("/cities", get(routes::dictionaries::cities))
        .route("/subjects", get(routes::dictionaries::subjects))
        .route("/all", get(routes::dictionaries::all));

    let post_routes = Router::new()
        .route("/", get(routes::posts::list))
        .route("/featured", get(routes::posts::featured))
        .route("/categories", get(routes::posts::categories))
        .route("/search", get(routes::posts::search))
        .route("/:slug", get(routes::posts::get_by_slug))
        .route("/:slug/related", get(routes::posts::related))
        .route("/:slug/like", post(routes::posts::like));

    let admin_routes = Router::new()
        .route("/dashboard", get(routes::admin::dashboard::dashboard))
        .route("/tutors", get(routes::admin::tutors::list))
        .route("/tutors/pending", get(routes::admin::tutors::pending))
        .route(
            "/tutors/:id",
            get(routes::admin::tutors::get).delete(routes::admin::tutors::delete_tutor),
        )
        .route("/tutors/:id/approve", post(routes::admin::tutors::approve))
        .route("/tutors/:id/reject", post(routes::admin::tutors::reject))
        .route(
            "/tutors/:id/request-changes",
            post(routes::admin::tutors::request_changes),
        )
        .route("/tutors/:id/block", post(routes::admin::tutors::block))
        .route("/tutors/:id/unblock", post(routes::admin::tutors::unblock))
        .route(
            "/posts",
            get(routes::admin::posts::list).post(routes::admin::posts::create),
        )
        .route(
            "/posts/:id",
            get(routes::admin::posts::get)
                .patch(routes::admin::posts::update)
                .delete(routes::admin::posts::delete_post),
        )
        .route("/posts/:id/publish", post(routes::admin::posts::publish))
        .route("/posts/:id/unpublish", post(routes::admin::posts::unpublish))
        .route("/posts/:id/duplicate", post(routes::admin::posts::duplicate))
        .route(
            "/categories",
            get(routes::admin::categories::list).post(routes::admin::categories::create),
        )
        .route(
            "/categories/:id",
            patch(routes::admin::categories::update)
                .delete(routes::admin::categories::delete_category),
        )
        .route(
            "/authors",
            get(routes::admin::authors::list).post(routes::admin::authors::create),
        )
        .route(
            "/authors/:id",
            patch(routes::admin::authors::update).delete(routes::admin::authors::delete_author),
        )
        .route("/feedback", get(routes::admin::feedback::list))
        .route(
            "/feedback/:id",
            get(routes::admin::feedback::get).patch(routes::admin::feedback::update),
        )
        .route("/users", get(routes::admin::users::list))
        .route("/users/:id", delete(routes::admin::users::delete_user))
        .route("/users/:id/block", post(routes::admin::users::block))
        .route("/users/:id/unblock", post(routes::admin::users::unblock))
        .route("/users/:id/roles", post(routes::admin::users::set_roles))
        .route("/settings", get(routes::admin::settings::list))
        .route("/settings/:key", patch(routes::admin::settings::update))
        .route("/media", get(routes::admin::media::list))
        .route(
            "/media/upload",
            post(routes::admin::media::upload).layer(routes::admin::media::media_body_limit()),
        )
        .route("/media/:id", delete(routes::admin::media::delete_media))
        .route(
            "/cities",
            get(routes::admin::dictionaries::list_cities)
                .post(routes::admin::dictionaries::create_city),
        )
        .route(
            "/cities/:id",
            patch(routes::admin::dictionaries::update_city)
                .delete(routes::admin::dictionaries::delete_city),
        )
        .route(
            "/subjects",
            get(routes::admin::dictionaries::list_subjects)
                .post(routes::admin::dictionaries::create_subject),
        )
        .route(
            "/subjects/:id",
            patch(routes::admin::dictionaries::update_subject)
                .delete(routes::admin::dictionaries::delete_subject),
        )
        .route("/analytics", get(routes::admin::analytics::full));

    let api = Router::new()
        .nest("/auth", auth_routes)
        .nest("/tutors", tutor_routes)
        .nest("/dictionaries", dict_routes)
        .nest("/posts", post_routes)
        .nest("/admin", admin_routes)
        .route("/feedback", post(routes::admin::feedback::create_public));

    let app = Router::new()
        .route("/health", get(routes::health::handler))
        .nest("/api", api)
        .nest_service("/uploads", ServeDir::new(upload_dir))
        .layer(TraceLayer::new_for_http())
        .layer(cors)
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    tracing::info!("listening on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .await?;
    Ok(())
}
