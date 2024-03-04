import { Vector2d } from "konva/lib/types";
import { absoluteCut, relativeCut } from "./cutter.store";

export function convertAbsoluteToRelative(abs: absoluteCut, imgSize: Vector2d): relativeCut {
    const top = abs.y / imgSize.y;
    const bottom = (abs.y + abs.height) / imgSize.y;

    const left = abs.x / imgSize.x;
    const right = (abs.x + abs.width) / imgSize.x;

    return {
        top: top,
        bottom: bottom,
        left: left,
        right: right
    };
}

export function convertRelativeToAbsolute(rel: relativeCut, imgSize: Vector2d): absoluteCut {
    const x = Math.round(rel.left * imgSize.x);
    const y = Math.round(rel.top * imgSize.y);

    const width = Math.round((rel.right - rel.left) * imgSize.x);
    const height = Math.round((rel.bottom - rel.top) * imgSize.y);

    return {
        x: x,
        y: y,
        width: width,
        height: height
    }
}

export function clamp(val: number, min: number, max: number): number {
    return Math.min(Math.max(val, min), max)
}