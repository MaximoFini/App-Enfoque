/**
 * playEndSound — Aviso sonoro al terminar un timer
 * ================================================
 * Usa la Web Audio API para generar un tono suave sin archivos externos.
 * Compatible con todos los navegadores modernos.
 */

/**
 * Reproduce un tono suave de fin de sesión.
 * @param type 'focus' para un único tono sine | 'pomodoro' para un acorde de 2 notas
 */
export const playEndSound = (type: "focus" | "pomodoro" = "focus"): void => {
    try {
        const AudioContextClass =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
                .webkitAudioContext;

        if (!AudioContextClass) return;

        const ctx = new AudioContextClass();

        const playTone = (
            frequency: number,
            startOffset: number,
            duration: number,
            gainPeak: number,
        ) => {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + startOffset);

            const start = ctx.currentTime + startOffset;
            const fadeEnd = start + duration;

            // Attack rápido + fade-out suave
            gainNode.gain.setValueAtTime(0, start);
            gainNode.gain.linearRampToValueAtTime(gainPeak, start + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, fadeEnd);

            oscillator.start(start);
            oscillator.stop(fadeEnd);
        };

        if (type === "focus") {
            // Un tono suave a 528 Hz (frecuencia "Mi") con fade de 2.5s
            playTone(528, 0, 2.5, 0.35);
        } else {
            // Pomodoro: acorde de 3 notas escalonadas (Do-Mi-Sol) para sensación de logro
            playTone(523.25, 0.0, 1.8, 0.3); // Do5
            playTone(659.25, 0.15, 1.8, 0.25); // Mi5
            playTone(783.99, 0.3, 1.8, 0.2); // Sol5
        }

        // Cerrar el contexto después de que los tones terminen
        setTimeout(() => {
            ctx.close();
        }, 3500);
    } catch (err) {
        // Silently fail — el sonido es accesorio, no crítico
        console.warn("playEndSound: Web Audio API no disponible", err);
    }
};
