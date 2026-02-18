import { ScaffoldPrompt } from '../types';

interface ScaffoldPromptCardProps {
  prompt: ScaffoldPrompt;
  onDismiss: () => void;
}

function getTypeIcon(type: ScaffoldPrompt['type']): string {
  switch (type) {
    case 'reflection': return '?';
    case 'encouragement': return '!';
    case 'strategy': return '*';
  }
}

function getTypeClass(type: ScaffoldPrompt['type']): string {
  return `scaffold-prompt--${type}`;
}

export default function ScaffoldPromptCard({ prompt, onDismiss }: ScaffoldPromptCardProps) {
  return (
    <div className={`scaffold-prompt ${getTypeClass(prompt.type)}`}>
      <div className="scaffold-prompt__icon">{getTypeIcon(prompt.type)}</div>
      <div className="scaffold-prompt__content">
        <h4 className="scaffold-prompt__title">{prompt.content.title}</h4>
        <p className="scaffold-prompt__message">{prompt.content.message}</p>
      </div>
      <button className="scaffold-prompt__action btn btn-primary" onClick={onDismiss}>
        {prompt.content.action}
      </button>
    </div>
  );
}
