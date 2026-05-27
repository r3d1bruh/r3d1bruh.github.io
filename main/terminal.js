document.addEventListener('DOMContentLoaded', () => {
    try {
        const terminal = document.getElementById('terminal');
        const terminalOutput = document.getElementById('terminal-output');
        const terminalInput = document.getElementById('terminal-input');
        const terminalPrompt = document.getElementById('terminal-prompt');
        const navLink = document.getElementById('nav-link-exchange');
        const navPC = document.getElementById('nav-pc-specs');
        const paneLink = document.getElementById('link-exchange');
        const panePC = document.getElementById('pc-specs');
        const content = document.querySelector('.content-area');
        const layout = document.querySelector('.layout-grid');

        const defaultPromptPrefix = 'C:\\Users\\Krane';
        const historyStorageKey = 'terminal_history';
        const maxHistoryEntries = 200;
        const builtInCommands = ['cls', 'dir', 'cd', 'start', 'neofetch', 'theme', 'layout', 'promptgap', 'help'];

        const vfs = {
            '/': {
                type: 'dir',
                children: {
                    'Google.html': { type: 'file' },
                    'LICENSE': { type: 'file' },
                    'README.md': { type: 'file' },
                    'build': { type: 'dir' },
                    'demo': { type: 'dir' },
                    'dora': { type: 'dir' },
                    'index.html': { type: 'file' },
                    'jsconfig.json': { type: 'file' },
                    'l': { type: 'dir' },
                    'main': { type: 'dir' },
                    'now.json': { type: 'file' },
                    'package.json': { type: 'file' },
                    'public': { type: 'dir' },
                    'src': { type: 'dir' },
                    'xp': { type: 'dir' }
                }
            },
            '/build': { type: 'dir', children: { 'assets': { type: 'dir' }, 'index.html': { type: 'file' }, 'main': { type: 'dir' }, 'manifest.json': { type: 'file' }, 'static': { type: 'dir' }, 'xp': { type: 'dir' } } },
            '/dora': { type: 'dir', children: { 'anushkaverse.html': { type: 'file' }, 'app-manifest.json': { type: 'file' }, 'app.html': { type: 'file' }, 'doraverse.html': { type: 'file' }, 'gallery': { type: 'dir' }, 'index.html': { type: 'file' }, 'manifest.json': { type: 'file' }, 'sw.js': { type: 'file' } } },
            '/l': { type: 'dir', children: { 'index.html': { type: 'file' } } },
            '/main': { type: 'dir', children: { 'index.html': { type: 'file' } } },
            '/public': { type: 'dir', children: { 'assets': { type: 'dir' }, 'cursor.js': { type: 'file' }, 'index.html': { type: 'file' }, 'main': { type: 'dir' }, 'manifest.json': { type: 'file' } } },
            '/src': { type: 'dir', children: { 'App.js': { type: 'file' }, 'assets': { type: 'dir' }, 'components': { type: 'dir' }, 'hooks': { type: 'dir' }, 'index.js': { type: 'file' }, 'serviceWorker.js': { type: 'file' }, 'WinXP': { type: 'dir' } } },
            '/xp': { type: 'dir', children: { 'index.html': { type: 'file' } } }
        };

        let cwd = '/';
        let history = loadHistory();
        let historyIndex = history.length;

        if (terminalInput && terminalInput.parentElement) {
            terminalInput.parentElement.classList.add('terminal-input-line');
        }

        function loadHistory() {
            try {
                const raw = localStorage.getItem(historyStorageKey);
                const parsed = raw ? JSON.parse(raw) : [];
                if (!Array.isArray(parsed)) return [];
                return parsed.filter((entry) => typeof entry === 'string' && entry.trim());
            } catch (error) {
                return [];
            }
        }

        function saveHistory() {
            try {
                localStorage.setItem(historyStorageKey, JSON.stringify(history.slice(-maxHistoryEntries)));
            } catch (error) {
                // Ignore storage failures.
            }
        }

        function pushHistory(value) {
            const entry = String(value || '').trim();
            if (!entry) return;
            history.push(entry);
            history = history.slice(-maxHistoryEntries);
            historyIndex = history.length;
            saveHistory();
        }

        function getNode(path) {
            return vfs[path] || null;
        }

        function resolvePath(inputPath) {
            if (!inputPath) return cwd;
            if (inputPath === '.') return cwd;
            if (inputPath === '..') {
                if (cwd === '/') return '/';
                const segments = cwd.split('/').filter(Boolean);
                segments.pop();
                return segments.length ? `/${segments.join('/')}` : '/';
            }

            if (inputPath.startsWith('/')) {
                return inputPath.replace(/\/+$/, '') || '/';
            }

            const base = cwd === '/' ? '' : cwd;
            const combined = `${base}/${inputPath}`.replace(/\/+/g, '/');
            return `/${combined.replace(/^\/+/, '').replace(/\/+$/, '')}` || '/';
        }

        function getPromptText() {
            const suffix = cwd === '/' ? '' : cwd.replace(/\//g, '\\');
            return `${defaultPromptPrefix}${suffix}>`;
        }

        function syncPromptWidth(target) {
            if (!target) return;
            target.style.setProperty('--terminal-prompt-width', `${getPromptText().length}ch`);
        }

        function setPrompt() {
            if (terminalPrompt) {
                terminalPrompt.textContent = getPromptText();
            }
            syncPromptWidth(terminal);
        }

        function scrollTerminalToBottom() {
            if (!terminal) return;
            terminal.scrollTop = terminal.scrollHeight;
        }

        function focusInput() {
            if (terminalInput) {
                terminalInput.focus();
            }
        }

        function appendTextLine(text, className = '') {
            if (!terminalOutput) return;
            const line = document.createElement('div');
            line.className = `terminal-line terminal-text${className ? ` ${className}` : ''}`;
            line.textContent = text;
            terminalOutput.appendChild(line);
            scrollTerminalToBottom();
            focusInput();
        }

        function createCommandEntry(promptText, commandText) {
            const entry = document.createElement('div');
            entry.className = 'terminal-line terminal-command-line';
            entry.style.setProperty('--terminal-prompt-width', `${promptText.length}ch`);

            const promptSpan = document.createElement('span');
            promptSpan.className = 'terminal-prompt';
            promptSpan.textContent = promptText;

            const commandSpan = document.createElement('span');
            commandSpan.className = 'terminal-command';
            commandSpan.textContent = commandText;

            entry.appendChild(promptSpan);
            entry.appendChild(commandSpan);
            return entry;
        }

        function appendCommandEcho(commandText) {
            if (!terminalOutput) return;
            terminalOutput.appendChild(createCommandEntry(getPromptText(), commandText));
            scrollTerminalToBottom();
            focusInput();
        }

        function createNeofetchBlock() {
            const wrapper = document.createElement('div');
            wrapper.className = 'terminal-neofetch';

            wrapper.appendChild(createCommandEntry(getPromptText(), 'neofetch'));

            const grid = document.createElement('div');
            grid.className = 'neofetch-grid';

            const logo = document.createElement('pre');
            logo.className = 'neofetch-logo';
            logo.textContent = [
                '        ,.=:!!t3Z3z.,',
                '       :tt:::tt333EE3',
                '       Et:::ztt33EEEL @Ee.,      ..,',
                '      ;tt:::tt333EE7 ;EEEEEEttttt33#',
                '     :Et:::zt333EEQ. $EEEEEttttt33QL',
                '     it::::tt333EEF @EEEEEEttttt33F',
                '    ;3=*^```"*4EEV :EEEEEEttttt33@.',
                '    ,.=::::!t=., ` @EEEEEEtttz33QF',
                '   ;::::::::zt33)   "4EEEtttji3P*',
                '  :t::::::::tt33.:Z3z..  `` ,..g.',
                '  i::::::::zt33F AEEEtttt::::ztF',
                ' ;:::::::::t33V ;EEEttttt::::t3',
                ' E::::::::zt33L @EEEtttt::::z3F',
                '{3=*^```"*4E3) ;EEEtttt:::::tZ`',
                '             ` :EEEEtttt::::z7',
                '                 "VEzjt:;;z>*`'
            ].join('\n');

            const info = document.createElement('div');
            info.className = 'neofetch-info';

            const title = document.createElement('div');
            title.className = 'neofetch-title';
            title.textContent = 'Krane@DESKTOP-I83AHIP';

            const divider = document.createElement('div');
            divider.className = 'neofetch-divider';
            divider.textContent = '--------------';

            const rows = [
                ['OS:', 'Windows 11'],
                ['Build:', '25H2 (26200)'],
                ['Uptime:', '2 days, 23 hours, 5 minutes'],
                ['Resolution:', '1920x1080 @60Hz'],
                ['Terminal:', 'Administrator: Command Prompt - neofetch'],
                ['CPU:', 'Intel(R) Core(TM) i7-10610U CPU @ 1.80GHz'],
                ['GPU:', 'Intel(R) UHD Graphics'],
                ['Memory:', '11203 MB / 16102 MB (69% in use)'],
                ['Disk:', 'C:\\ 385.02 GB (19.34 GB free)']
            ];

            info.appendChild(title);
            info.appendChild(divider);

            rows.forEach(([label, value]) => {
                const row = document.createElement('div');
                row.className = 'neofetch-row';

                const labelSpan = document.createElement('span');
                labelSpan.className = 'neofetch-label';
                labelSpan.textContent = label;

                const valueSpan = document.createElement('span');
                valueSpan.className = 'neofetch-value';
                valueSpan.textContent = value;

                row.appendChild(labelSpan);
                row.appendChild(valueSpan);
                info.appendChild(row);
            });

            const palette = document.createElement('div');
            palette.className = 'neofetch-palette';
            ['#3b4252', '#bf616a', '#a3be8c', '#ebcb8b', '#81a1c1', '#b48ead', '#88c0d0', '#eceff4'].forEach((color) => {
                const block = document.createElement('span');
                block.style.background = color;
                palette.appendChild(block);
            });

            grid.appendChild(logo);
            grid.appendChild(info);

            wrapper.appendChild(grid);
            wrapper.appendChild(palette);
            return wrapper;
        }

        function appendNeofetch() {
            if (!terminalOutput) return;
            terminalOutput.appendChild(createNeofetchBlock());
            scrollTerminalToBottom();
            focusInput();
        }

        function tryAutocomplete(input) {
            const query = String(input || '').trim();
            const node = getNode(cwd) || { children: {} };
            const currentChildren = Object.keys(node.children || {});
            const rootChildren = Object.keys((vfs['/'] && vfs['/'].children) || {});
            const candidates = Array.from(new Set([...builtInCommands, ...currentChildren, ...rootChildren]));
            if (!query) return candidates;
            return candidates.filter((entry) => entry.toLowerCase().startsWith(query.toLowerCase()));
        }

        function clearTerminal() {
            if (terminalOutput) {
                terminalOutput.innerHTML = '';
            }
        }

        function setLayoutMode(mode) {
            if (!terminal) return;
            terminal.style.height = mode === 'compact' ? '320px' : '450px';
        }

        function setTerminalGap(px) {
            if (!terminal) return;
            const value = Math.max(0, Number(px) || 0);
            terminal.style.setProperty('--terminal-gap', `${value}px`);
        }

        function runCommand(rawInput) {
            const raw = String(rawInput || '');
            const input = raw.trim();
            if (!input) return;

            const parts = input.split(/\s+/);
            const command = parts[0].toLowerCase();
            const arg = parts.slice(1).join(' ');

            if (command === 'cls') {
                clearTerminal();
                return;
            }

            if (command !== 'neofetch') {
                appendCommandEcho(input);
            }

            if (command === 'dir') {
                const node = getNode(cwd);
                if (!node || node.type !== 'dir') {
                    appendTextLine('File not found.', 'terminal-muted');
                    return;
                }

                const names = Object.keys(node.children || {}).sort((left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' }));
                appendTextLine(names.length ? names.join('  ') : '(empty)', 'terminal-muted');
                return;
            }

            if (command === 'cd') {
                if (!arg) {
                    appendTextLine(cwd, 'terminal-muted');
                    return;
                }

                const nextPath = resolvePath(arg);
                const node = getNode(nextPath);
                if (!node || node.type !== 'dir') {
                    appendTextLine('The system cannot find the path specified.', 'terminal-muted');
                    return;
                }

                cwd = nextPath;
                setPrompt();
                return;
            }

            if (command === 'start') {
                if (!arg) {
                    appendTextLine('Usage: start <path>', 'terminal-muted');
                    return;
                }

                if (/^https?:\/\//i.test(arg)) {
                    window.open(arg, '_blank', 'noopener');
                    return;
                }

                const targetPath = resolvePath(arg);
                const node = getNode(targetPath);

                if (node && node.type === 'dir') {
                    window.open(`${targetPath}/index.html`, '_blank', 'noopener');
                    return;
                }

                if (node && node.type === 'file') {
                    window.open(targetPath, '_blank', 'noopener');
                    return;
                }

                window.open(targetPath, '_blank', 'noopener');
                return;
            }

            if (command === 'neofetch') {
                appendNeofetch();
                return;
            }

            if (command === 'theme') {
                if (!arg || arg.toLowerCase() === 'default') {
                    appendTextLine('Theme: default', 'terminal-muted');
                    return;
                }

                appendTextLine('Only the default theme is available.', 'terminal-muted');
                return;
            }

            if (command === 'layout') {
                if (!arg) {
                    appendTextLine('Usage: layout <compact|normal>', 'terminal-muted');
                    return;
                }

                const mode = arg.toLowerCase();
                if (mode === 'compact') {
                    setLayoutMode('compact');
                    appendTextLine('Layout: compact', 'terminal-muted');
                    return;
                }

                setLayoutMode('normal');
                appendTextLine('Layout: normal', 'terminal-muted');
                return;
            }

            if (command === 'promptgap') {
                if (!arg) {
                    const gap = getComputedStyle(terminal).getPropertyValue('--terminal-gap').trim() || '0px';
                    appendTextLine(`Prompt gap: ${gap}`, 'terminal-muted');
                    return;
                }

                const keywords = {
                    tight: 0,
                    normal: 0,
                    wide: 4
                };

                const value = Object.prototype.hasOwnProperty.call(keywords, arg.toLowerCase()) ? keywords[arg.toLowerCase()] : Number(arg);
                if (!Number.isFinite(value) || value < 0) {
                    appendTextLine('Usage: promptgap <px|tight|normal|wide>', 'terminal-muted');
                    return;
                }

                setTerminalGap(value);
                appendTextLine(`Prompt gap set to ${value}px`, 'terminal-muted');
                return;
            }

            if (command === 'help') {
                appendTextLine('Available commands: cls, dir, cd, start, neofetch, theme, layout, promptgap, help', 'terminal-muted');
                return;
            }

            appendTextLine(`'${command}' is not recognized as an internal or external command.`, 'terminal-muted');
        }

        function setActive(button) {
            [navLink, navPC].forEach((element) => element && element.classList.remove('active'));
            if (button) button.classList.add('active');
        }

        function showPane(pane) {
            if (pane === 'link') {
                if (paneLink) paneLink.style.display = 'block';
                if (panePC) panePC.style.display = 'none';
                if (content) content.classList.remove('terminal-mode');
                if (layout) layout.classList.remove('terminal-layout');
                setActive(navLink);
                return;
            }

            if (paneLink) paneLink.style.display = 'none';
            if (panePC) panePC.style.display = 'block';
            if (content) content.classList.add('terminal-mode');
            if (layout) layout.classList.add('terminal-layout');
            setActive(navPC);
        }

        if (navLink) {
            navLink.addEventListener('click', () => {
                showPane('link');
                if (paneLink) paneLink.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        }

        if (navPC) {
            navPC.addEventListener('click', () => {
                showPane('pc');
                if (panePC) panePC.scrollIntoView({ behavior: 'smooth', block: 'center' });
                pushHistory('neofetch');
                runCommand('neofetch');
            });
        }

        if (terminalInput) {
            terminalInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    const value = terminalInput.value;
                    terminalInput.value = '';
                    if (value.trim()) {
                        pushHistory(value);
                        runCommand(value);
                    }
                    return;
                }

                if (event.key === 'ArrowUp') {
                    if (!history.length) return;
                    historyIndex = historyIndex > 0 ? historyIndex - 1 : history.length - 1;
                    terminalInput.value = history[historyIndex] || '';
                    event.preventDefault();
                    return;
                }

                if (event.key === 'ArrowDown') {
                    if (!history.length) return;
                    if (historyIndex < history.length - 1) {
                        historyIndex += 1;
                        terminalInput.value = history[historyIndex] || '';
                    } else {
                        historyIndex = history.length;
                        terminalInput.value = '';
                    }
                    event.preventDefault();
                    return;
                }

                if (event.key === 'Tab') {
                    event.preventDefault();
                    const matches = tryAutocomplete(terminalInput.value);
                    if (matches.length === 1) {
                        terminalInput.value = matches[0];
                        return;
                    }

                    if (matches.length > 1) {
                        appendTextLine(matches.join('  '), 'terminal-muted');
                    }
                }
            });
        }

        setPrompt();
        setTerminalGap(0);

        window.runCommand = runCommand;
        window.showPane = showPane;
    } catch (error) {
        console.error('terminal initialization failed', error);
    }
});
