class P5Utils {
    constrain(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    map(value, start1, stop1, start2, stop2) {
        return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
    }

    lerp(start, stop, amt) {
        return start + (stop - start) * amt;
    }

    radians(degrees) {
        return degrees * (Math.PI / 180);
    }

    degrees(radians) {
        return radians * (180 / Math.PI);
    }

    cos(angle) {
        return Math.cos(angle);
    }

    sin(angle) {
        return Math.sin(angle);
    }
}

export const p5Utils = new P5Utils();
