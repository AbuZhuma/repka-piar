import type { Block } from '@/entities/post';

import { CalloutBlock } from './blocks/CalloutBlock';
import { CodeBlock } from './blocks/CodeBlock';
import { DividerBlock } from './blocks/DividerBlock';
import { EmbedBlock } from './blocks/EmbedBlock';
import { GalleryBlock } from './blocks/GalleryBlock';
import { HeadingBlock } from './blocks/HeadingBlock';
import { ImageBlock } from './blocks/ImageBlock';
import { ListBlock } from './blocks/ListBlock';
import { ParagraphBlock } from './blocks/ParagraphBlock';
import { QuoteBlock } from './blocks/QuoteBlock';
import { VideoBlock } from './blocks/VideoBlock';

interface BlockRendererProps {
  blocks: Block[];
}

export function BlockRenderer({ blocks }: BlockRendererProps) {
  return (
    <>
      {blocks.map((block) => {
        switch (block.type) {
          case 'heading':
            return (
              <HeadingBlock key={block.id} id={block.id} {...block.data} />
            );
          case 'paragraph':
            return <ParagraphBlock key={block.id} {...block.data} />;
          case 'image':
            return <ImageBlock key={block.id} {...block.data} />;
          case 'video':
            return <VideoBlock key={block.id} {...block.data} />;
          case 'quote':
            return <QuoteBlock key={block.id} {...block.data} />;
          case 'list':
            return <ListBlock key={block.id} {...block.data} />;
          case 'divider':
            return <DividerBlock key={block.id} />;
          case 'callout':
            return <CalloutBlock key={block.id} {...block.data} />;
          case 'code':
            return <CodeBlock key={block.id} {...block.data} />;
          case 'gallery':
            return <GalleryBlock key={block.id} {...block.data} />;
          case 'embed':
            return <EmbedBlock key={block.id} {...block.data} />;
          default:
            return null;
        }
      })}
    </>
  );
}
