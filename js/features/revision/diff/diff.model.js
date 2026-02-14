/**
 * DIFF MODULE - MODEL
 * Pure logic for text comparison and Myers algorithm implementation.
 */

const DiffModel = {
    /**
     * Extracts plain text from HTML content.
     * @param {string} html 
     * @returns {string}
     */
    stripHtml(html) {
        if (!html) return '';

        // Replace block tags with line breaks for better diff clarity
        let text = html
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<\/div>/gi, '\n')
            .replace(/<\/h[1-6]>/gi, '\n\n')
            .replace(/<\/li>/gi, '\n')
            .replace(/<\/tr>/gi, '\n');

        // Create temporary element to extract text
        const tmp = document.createElement('div');
        tmp.innerHTML = text;
        text = tmp.textContent || tmp.innerText || '';

        // Normalize line breaks
        text = text.replace(/\n{3,}/g, '\n\n');

        return text.trim();
    },

    /**
     * Splits text into tokens (words and line breaks).
     * @param {string} text 
     * @returns {Array} Array of token objects
     */
    tokenizeText(text) {
        const tokens = [];
        const lines = text.split(/\n/);

        lines.forEach((line, lineIndex) => {
            const words = line.split(/\s+/).filter(w => w.length > 0);
            words.forEach(word => {
                tokens.push({ word: word, isBreak: false });
            });
            // Add a line break marker except for the last line
            if (lineIndex < lines.length - 1) {
                tokens.push({ word: '\n', isBreak: true });
            }
        });

        return tokens;
    },

    /**
     * Implementation of Myers' Diff Algorithm.
     * @param {Array} oldTokens 
     * @param {Array} newTokens 
     * @returns {Array} The diff results
     */
    myersDiff(oldTokens, newTokens) {
        const N = oldTokens.length;
        const M = newTokens.length;
        const MAX = N + M;

        // Token equality helper
        const tokensEqual = (a, b) => {
            if (a.isBreak && b.isBreak) return true;
            if (a.isBreak || b.isBreak) return false;
            return a.word === b.word;
        };

        // Edge cases
        if (N === 0 && M === 0) return [];
        if (N === 0) return newTokens.map(t => ({ type: 'added', text: t.word, isBreak: t.isBreak }));
        if (M === 0) return oldTokens.map(t => ({ type: 'removed', text: t.word, isBreak: t.isBreak }));

        // V contains the furthest endpoints for each diagonal
        const V = new Map();
        V.set(1, 0);

        // Trace keeps history to reconstruct the path
        const trace = [];

        // Search for the shortest edit script
        let found = false;
        for (let D = 0; D <= MAX && !found; D++) {
            trace.push(new Map(V));

            for (let k = -D; k <= D; k += 2) {
                let x;
                if (k === -D || (k !== D && (V.get(k - 1) || 0) < (V.get(k + 1) || 0))) {
                    x = V.get(k + 1) || 0; // Move down (insertion)
                } else {
                    x = (V.get(k - 1) || 0) + 1; // Move right (deletion)
                }

                let y = x - k;

                // Follow diagonal (identical elements)
                while (x < N && y < M && tokensEqual(oldTokens[x], newTokens[y])) {
                    x++;
                    y++;
                }

                V.set(k, x);

                if (x >= N && y >= M) {
                    found = true;
                    break;
                }
            }
        }

        // Backtrack to reconstruct the path
        const result = [];
        let x = N;
        let y = M;

        for (let d = trace.length - 1; d >= 0; d--) {
            const V = trace[d];
            const k = x - y;

            let prevK;
            if (k === -d || (k !== d && (V.get(k - 1) || 0) < (V.get(k + 1) || 0))) {
                prevK = k + 1;
            } else {
                prevK = k - 1;
            }

            const prevX = V.get(prevK) || 0;
            const prevY = prevX - prevK;

            // Add diagonals (identical items)
            while (x > prevX && y > prevY) {
                x--;
                y--;
                result.unshift({ type: 'same', text: oldTokens[x].word, isBreak: oldTokens[x].isBreak });
            }

            // Add insertion or deletion
            if (d > 0) {
                if (x === prevX) {
                    y--;
                    result.unshift({ type: 'added', text: newTokens[y].word, isBreak: newTokens[y].isBreak });
                } else {
                    x--;
                    result.unshift({ type: 'removed', text: oldTokens[x].word, isBreak: oldTokens[x].isBreak });
                }
            }
        }

        return result;
    },

    /**
     * Computes the diff between two HTML strings.
     * @param {string} oldHtml 
     * @param {string} newHtml 
     * @returns {Array} Structured diff data
     */
    computeDiff(oldHtml, newHtml) {
        const oldText = this.stripHtml(oldHtml);
        const newText = this.stripHtml(newHtml);

        const oldTokens = this.tokenizeText(oldText);
        const newTokens = this.tokenizeText(newText);

        const diffResults = this.myersDiff(oldTokens, newTokens);

        // Group into a standard format for rendering
        // In the current implementation, everything is treated as one large paragraph of items.
        return [{ type: 'paragraph', items: diffResults }];
    },

    /**
     * Escapes HTML to prevent XSS.
     * @param {string} text 
     * @returns {string}
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};
