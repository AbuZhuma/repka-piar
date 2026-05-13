'use client';

import {
  ChevronDown,
  ChevronUp,
  Code,
  Heading,
  Image as ImageIcon,
  Images,
  Info,
  Link2,
  List,
  Minus,
  Plus,
  Quote,
  Trash2,
  Type,
  Video,
} from 'lucide-react';
import { useState } from 'react';

import type { Block, BlockType } from '@/entities/post';
import { cn } from '@/shared/lib/cn';

import { CalloutEditor } from './blocks/CalloutEditor';
import { CodeEditor } from './blocks/CodeEditor';
import { DividerEditor } from './blocks/DividerEditor';
import { EmbedEditor } from './blocks/EmbedEditor';
import { GalleryEditor } from './blocks/GalleryEditor';
import { HeadingEditor } from './blocks/HeadingEditor';
import { ImageEditor } from './blocks/ImageEditor';
import { ListEditor } from './blocks/ListEditor';
import { ParagraphEditor } from './blocks/ParagraphEditor';
import { QuoteEditor } from './blocks/QuoteEditor';
import { VideoEditor } from './blocks/VideoEditor';

import styles from './PostEditor.module.scss';

interface Props {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}

const BLOCK_MENU: Array<{
  group: string;
  items: Array<{ type: BlockType; label: string; icon: React.ReactNode }>;
}> = [
  {
    group: 'Текст',
    items: [
      { type: 'heading', label: 'Заголовок', icon: <Heading size={16} /> },
      { type: 'paragraph', label: 'Параграф', icon: <Type size={16} /> },
      { type: 'list', label: 'Список', icon: <List size={16} /> },
      { type: 'quote', label: 'Цитата', icon: <Quote size={16} /> },
    ],
  },
  {
    group: 'Медиа',
    items: [
      { type: 'image', label: 'Изображение', icon: <ImageIcon size={16} /> },
      { type: 'video', label: 'Видео', icon: <Video size={16} /> },
      { type: 'gallery', label: 'Галерея', icon: <Images size={16} /> },
    ],
  },
  {
    group: 'Спец-блоки',
    items: [
      { type: 'callout', label: 'Плашка', icon: <Info size={16} /> },
      { type: 'code', label: 'Код', icon: <Code size={16} /> },
      { type: 'divider', label: 'Разделитель', icon: <Minus size={16} /> },
      { type: 'embed', label: 'Встраивание', icon: <Link2 size={16} /> },
    ],
  },
];

function genId() {
  return `b_${Math.random().toString(36).slice(2, 10)}`;
}

function defaultData(type: BlockType): Block {
  const id = genId();
  switch (type) {
    case 'heading':
      return { id, type, data: { level: 2, text: '' } };
    case 'paragraph':
      return { id, type, data: { text: '' } };
    case 'image':
      return { id, type, data: { url: '', alt: '', size: 'medium' } };
    case 'video':
      return { id, type, data: { url: '', provider: 'youtube' } };
    case 'quote':
      return { id, type, data: { text: '', author: '' } };
    case 'list':
      return { id, type, data: { style: 'bullet', items: [''] } };
    case 'divider':
      return { id, type, data: {} };
    case 'callout':
      return { id, type, data: { variant: 'info', title: '', text: '' } };
    case 'code':
      return { id, type, data: { language: '', code: '' } };
    case 'gallery':
      return { id, type, data: { images: [], layout: 'grid' } };
    case 'embed':
      return { id, type, data: { url: '' } };
  }
}

export function PostEditor({ blocks, onChange }: Props) {
  const [menuFor, setMenuFor] = useState<number | null>(null);

  const addAt = (index: number, type: BlockType) => {
    const next = [...blocks];
    next.splice(index, 0, defaultData(type));
    onChange(next);
    setMenuFor(null);
  };

  const updateBlock = (index: number, data: Record<string, unknown>) => {
    const next = blocks.map((b, i) => (i === index ? ({ ...b, data: { ...b.data, ...data } } as Block) : b));
    onChange(next);
  };

  const removeBlock = (index: number) => {
    onChange(blocks.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[j]] = [next[j], next[index]];
    onChange(next);
  };

  return (
    <div className={styles.editor}>
      <Inserter onPick={(t) => addAt(0, t)} open={menuFor === 0} setOpen={(v) => setMenuFor(v ? 0 : null)} />

      {blocks.map((block, idx) => (
        <div key={block.id}>
          <div className={styles.blockShell}>
            <div className={styles.blockToolbar}>
              <button
                type="button"
                onClick={() => moveBlock(idx, -1)}
                disabled={idx === 0}
                aria-label="Выше"
              >
                <ChevronUp size={14} />
              </button>
              <button
                type="button"
                onClick={() => moveBlock(idx, 1)}
                disabled={idx === blocks.length - 1}
                aria-label="Ниже"
              >
                <ChevronDown size={14} />
              </button>
              <span className={styles.blockType}>{block.type}</span>
              <button
                type="button"
                onClick={() => removeBlock(idx)}
                className={styles.removeBtn}
                aria-label="Удалить"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className={styles.blockBody}>
              <BlockEditor block={block} onUpdate={(data) => updateBlock(idx, data)} />
            </div>
          </div>

          <Inserter
            onPick={(t) => addAt(idx + 1, t)}
            open={menuFor === idx + 1}
            setOpen={(v) => setMenuFor(v ? idx + 1 : null)}
          />
        </div>
      ))}
    </div>
  );
}

function BlockEditor({
  block,
  onUpdate,
}: {
  block: Block;
  onUpdate: (data: Record<string, unknown>) => void;
}) {
  switch (block.type) {
    case 'heading':
      return <HeadingEditor data={block.data} onChange={onUpdate} />;
    case 'paragraph':
      return <ParagraphEditor data={block.data} onChange={onUpdate} />;
    case 'image':
      return <ImageEditor data={block.data} onChange={onUpdate} />;
    case 'video':
      return <VideoEditor data={block.data} onChange={onUpdate} />;
    case 'quote':
      return <QuoteEditor data={block.data} onChange={onUpdate} />;
    case 'list':
      return <ListEditor data={block.data} onChange={onUpdate} />;
    case 'divider':
      return <DividerEditor />;
    case 'callout':
      return <CalloutEditor data={block.data} onChange={onUpdate} />;
    case 'code':
      return <CodeEditor data={block.data} onChange={onUpdate} />;
    case 'gallery':
      return <GalleryEditor data={block.data} onChange={onUpdate} />;
    case 'embed':
      return <EmbedEditor data={block.data} onChange={onUpdate} />;
  }
}

function Inserter({
  onPick,
  open,
  setOpen,
}: {
  onPick: (t: BlockType) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  return (
    <div className={cn(styles.inserter, open && styles.inserterOpen)}>
      <button type="button" className={styles.addBtn} onClick={() => setOpen(!open)}>
        <Plus size={14} /> {open ? 'Скрыть' : 'Добавить блок'}
      </button>
      {open && (
        <div className={styles.menu}>
          {BLOCK_MENU.map((g) => (
            <div key={g.group} className={styles.menuGroup}>
              <span className={styles.menuGroupTitle}>{g.group}</span>
              <div className={styles.menuItems}>
                {g.items.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    className={styles.menuItem}
                    onClick={() => onPick(item.type)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
