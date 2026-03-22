import * as react_jsx_runtime from 'react/jsx-runtime';
import { CSSProperties } from 'react';

interface SpriteConfig {
    src: string;
    frameWidth: number;
    frameHeight: number;
    frameCount: number;
}
interface MovementConfig {
    speed: number;
    pauseMin: number;
    pauseMax: number;
    frameRate: number;
}
interface SpeechBubbleConfig {
    text: string;
    style?: CSSProperties;
}
interface CharacterConfig {
    id: string;
    name?: string;
    state: string;
    startPosition: {
        x: number;
        y: number;
    };
    sprites: Record<string, SpriteConfig>;
    movement?: Partial<MovementConfig>;
    speechBubble?: SpeechBubbleConfig;
}
interface MonsterPlaygroundProps {
    mapWidth: number;
    mapHeight: number;
    tileSize: number;
    backgroundImage: string;
    walkableMask: string;
    cameraFollowInterval?: number;
    cameraPanResumeTimeout?: number;
    initialZoom?: number;
    minZoom?: number;
    maxZoom?: number;
    characters: CharacterConfig[];
    defaultMovement?: Partial<MovementConfig>;
}

declare function MonsterPlayground(props: MonsterPlaygroundProps): react_jsx_runtime.JSX.Element;

export { type CharacterConfig, MonsterPlayground, type MonsterPlaygroundProps, type MovementConfig, type SpeechBubbleConfig, type SpriteConfig };
