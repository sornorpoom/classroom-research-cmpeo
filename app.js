document.addEventListener('DOMContentLoaded', () => {
    // Check if data is available
    if (typeof classroomResearchData === 'undefined') {
        console.error("classroomResearchData is not defined. Make sure data.js is loaded first.");
        return;
    }

    // App State
    const state = {
        currentTab: 'dashboard',
        readChapters: JSON.parse(localStorage.getItem('readChapters') || '[]'),
        quizHighScores: JSON.parse(localStorage.getItem('quizHighScores') || '{}'),
        mockHistory: JSON.parse(localStorage.getItem('mockHistory') || '[]'),
        theme: localStorage.getItem('theme') || 'dark',
        
        // Active Quiz State
        activeQuiz: {
            isActive: false,
            chapterId: null, // null means Mock Exam
            questions: [],
            currentIndex: 0,
            selectedAnswer: null,
            isAnswered: false,
            score: 0,
            startTime: null,
            timerInterval: null,
            elapsedSeconds: 0,
            userAnswers: [] // array of selected answers
        },
        
        // Active Reading State
        activeChapterId: 1
    };

    // DOM Elements
    const elements = {
        // Registration Modal
        registrationOverlay: document.getElementById('registration-overlay'),
        registrationForm: document.getElementById('registration-form'),
        regName: document.getElementById('reg-name'),
        regSchool: document.getElementById('reg-school'),
        regEmail: document.getElementById('reg-email'),
        regSheetsUrl: document.getElementById('reg-sheets-url'),
        advancedToggle: document.getElementById('advanced-toggle'),
        advancedPanel: document.getElementById('advanced-panel'),
        sidebarResetProfileBtn: document.getElementById('sidebar-reset-profile-btn'),
        dbWelcomeTitle: document.getElementById('db-welcome-title'),

        // Navigation & Theme
        themeToggleBtn: document.getElementById('theme-toggle-btn'),
        themeIconSun: document.getElementById('theme-icon-sun'),
        themeIconMoon: document.getElementById('theme-icon-moon'),
        navItems: document.querySelectorAll('.nav-item'),
        tabContents: document.querySelectorAll('.tab-content'),
        
        // Mobile Sidebar Toggle
        menuToggleBtn: document.getElementById('menu-toggle-btn'),
        sidebar: document.querySelector('.sidebar'),
        
        // Dashboard
        dbWelcomeName: document.getElementById('db-welcome-name'),
        dbReadingProgressText: document.getElementById('db-reading-progress-text'),
        dbReadingProgressSub: document.getElementById('db-reading-progress-sub'),
        dbReadingProgressBar: document.getElementById('db-reading-progress-bar'),
        dbQuizAverage: document.getElementById('db-quiz-average'),
        dbQuizCount: document.getElementById('db-quiz-count'),
        dbMockExamText: document.getElementById('db-mock-exam-text'),
        dbMockExamSub: document.getElementById('db-mock-exam-sub'),
        dbQuickStartBtn: document.getElementById('db-quick-start-btn'),
        dbQuickQuizBtn: document.getElementById('db-quick-quiz-btn'),
        dbStatsGrid: document.getElementById('db-stats-grid'),
        
        // Learn Tab
        learnChaptersList: document.getElementById('learn-chapters-list'),
        learnReaderPane: document.getElementById('learn-reader-pane'),
        
        // Quiz Tab
        quizMainView: document.getElementById('quiz-main-view'),
        quizActiveView: document.getElementById('quiz-active-view'),
        quizResultView: document.getElementById('quiz-result-view'),
        quizChaptersList: document.getElementById('quiz-chapters-list'),
        mockExamBtn: document.getElementById('mock-exam-btn'),
        quizCancelBtn: document.getElementById('quiz-cancel-btn'),
        
        // Promotion Tab
        promoLevelBtns: document.querySelectorAll('.level-btn'),
        promoRole: document.getElementById('promo-role'),
        promoScope: document.getElementById('promo-scope'),
        promoDuration: document.getElementById('promo-duration'),
        promoLiterature: document.getElementById('promo-literature'),
        promoSample: document.getElementById('promo-sample'),
        promoTools: document.getElementById('promo-tools'),
        promoAnalysis: document.getElementById('promo-analysis'),
        promoPresentation: document.getElementById('promo-presentation'),
        promoAdvance: document.getElementById('promo-advance')
    };

    // Initialize Theme
    document.documentElement.setAttribute('data-theme', state.theme);
    updateThemeIcon();

    // Event Listeners
    elements.themeToggleBtn.addEventListener('click', toggleTheme);
    if (elements.quizCancelBtn) {
        elements.quizCancelBtn.addEventListener('click', cancelQuiz);
    }
    
    // Sidebar Navigation Tabs
    elements.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.getAttribute('data-tab');
            switchTab(tabId);
            
            // Close mobile menu if open
            if (elements.sidebar.classList.contains('open')) {
                elements.sidebar.classList.remove('open');
            }
        });
    });

    // Mobile Menu Toggle
    if (elements.menuToggleBtn) {
        elements.menuToggleBtn.addEventListener('click', () => {
            elements.sidebar.classList.toggle('open');
        });
    }

    // Dashboard Quick Actions
    if (elements.dbQuickStartBtn) {
        elements.dbQuickStartBtn.addEventListener('click', () => {
            switchTab('learn');
        });
    }
    if (elements.dbQuickQuizBtn) {
        elements.dbQuickQuizBtn.addEventListener('click', () => {
            switchTab('quiz');
        });
    }

    // Registration Form Event Handlers
    if (elements.advancedToggle) {
        elements.advancedToggle.addEventListener('click', (e) => {
            e.preventDefault();
            const panel = elements.advancedPanel;
            if (panel.style.display === 'none') {
                panel.style.display = 'block';
                elements.advancedToggle.textContent = 'ซ่อนการตั้งค่าระบบ Google Sheet';
            } else {
                panel.style.display = 'none';
                elements.advancedToggle.textContent = 'ตั้งค่าระบบ Google Sheet (ขั้นสูง)';
            }
        });
    }

    if (elements.registrationForm) {
        elements.registrationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            submitRegistration();
        });
    }

    if (elements.sidebarResetProfileBtn) {
        elements.sidebarResetProfileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            resetUserProfile();
        });
    }

    // Theme Switcher Logic
    function toggleTheme() {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', state.theme);
        localStorage.setItem('theme', state.theme);
        updateThemeIcon();
    }

    function updateThemeIcon() {
        if (state.theme === 'light') {
            elements.themeIconSun.style.display = 'none';
            elements.themeIconMoon.style.display = 'block';
        } else {
            elements.themeIconSun.style.display = 'block';
            elements.themeIconMoon.style.display = 'none';
        }
    }

    function cancelQuiz() {
        if (confirm("คุณต้องการยกเลิกการทำข้อสอบนี้ใช่หรือไม่? คะแนนที่ทำไว้จะไม่ได้รับการบันทึก")) {
            stopTimer();
            state.activeQuiz.isActive = false;
            renderQuizTab();
        }
    }

    // Tab Switcher Logic
    function switchTab(tabId) {
        state.currentTab = tabId;
        
        // Update Nav Menu active class
        elements.navItems.forEach(nav => {
            if (nav.getAttribute('data-tab') === tabId) {
                nav.classList.add('active');
            } else {
                nav.classList.remove('active');
            }
        });

        // Update Tab Container visibility
        elements.tabContents.forEach(content => {
            if (content.id === `${tabId}-tab`) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });

        // Trigger tab-specific renders
        if (tabId === 'dashboard') {
            renderDashboard();
        } else if (tabId === 'learn') {
            renderLearnTab();
        } else if (tabId === 'quiz') {
            renderQuizTab();
        } else if (tabId === 'promotion') {
            renderPromotionTab();
        }
    }

    // ----------------------------------------------------
    // DASHBOARD TAB CONTROLLER
    // ----------------------------------------------------
    function renderDashboard() {
        // Reading Progress
        const totalChapters = 12;
        const readCount = state.readChapters.length;
        const readPercent = Math.round((readCount / totalChapters) * 100);
        
        if (elements.dbReadingProgressText) {
            elements.dbReadingProgressText.textContent = `${readPercent}%`;
        }
        if (elements.dbReadingProgressSub) {
            elements.dbReadingProgressSub.textContent = `อ่านแล้ว ${readCount} จาก 12 บท`;
        }
        if (elements.dbReadingProgressBar) {
            elements.dbReadingProgressBar.style.strokeDashoffset = 251 - (251 * readPercent) / 100;
        }

        // Quiz Stats
        const quizScores = Object.values(state.quizHighScores);
        const quizCount = quizScores.length;
        const avgScore = quizCount > 0 
            ? Math.round(quizScores.reduce((sum, s) => sum + s, 0) / quizCount) 
            : 0;
            
        if (elements.dbQuizAverage) {
            elements.dbQuizAverage.textContent = `${avgScore}%`;
        }
        if (elements.dbQuizCount) {
            elements.dbQuizCount.textContent = `ทดสอบไปแล้ว ${quizCount} บท`;
        }

        // Mock Exams
        const mockCount = state.mockHistory.length;
        const bestMock = mockCount > 0
            ? Math.max(...state.mockHistory.map(m => m.percent))
            : 0;

        if (elements.dbMockExamText) {
            elements.dbMockExamText.textContent = mockCount > 0 ? `${bestMock}%` : '-';
        }
        if (elements.dbMockExamSub) {
            elements.dbMockExamSub.textContent = `ทำจำลองข้อสอบไปแล้ว ${mockCount} ครั้ง`;
        }

        // Render chapter card summary in dashboard
        renderDashboardChapters();
    }

    function renderDashboardChapters() {
        if (!elements.dbStatsGrid) return;
        
        elements.dbStatsGrid.innerHTML = '';
        
        classroomResearchData.chapters.forEach(c => {
            const isRead = state.readChapters.includes(c.id);
            const highScore = state.quizHighScores[c.id];
            
            const card = document.createElement('div');
            card.className = 'card stat-widget';
            card.innerHTML = `
                <div class="stat-icon" style="background-color: ${isRead ? 'var(--success-light)' : 'rgba(99, 102, 241, 0.08)'}; color: ${isRead ? 'var(--success)' : 'var(--primary)'}">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                    </svg>
                </div>
                <div class="stat-info" style="flex-grow: 1;">
                    <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 2px;">บทที่ ${c.id}: ${c.title}</h4>
                    <p style="font-size: 12px; color: var(--text-secondary);">
                        ${isRead ? '<span style="color: var(--success);">อ่านแล้ว</span>' : 'ยังไม่ได้อ่าน'} 
                        ${highScore !== undefined ? ` • คะแนนสูงสุด: <span style="font-weight:600; color:var(--primary-light)">${highScore}%</span>` : ''}
                    </p>
                </div>
                <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;" onclick="window.appActions.openChapter(${c.id})">อ่าน</button>
            `;
            elements.dbStatsGrid.appendChild(card);
        });
    }

    // ----------------------------------------------------
    // KNOWLEDGE HUB TAB CONTROLLER (LEARN)
    // ----------------------------------------------------
    function renderLearnTab() {
        if (!elements.learnChaptersList) return;

        // Render Sidebar Chapter List
        elements.learnChaptersList.innerHTML = '';
        classroomResearchData.chapters.forEach(c => {
            const isRead = state.readChapters.includes(c.id);
            const activeClass = state.activeChapterId === c.id ? 'active' : '';
            
            const btn = document.createElement('a');
            btn.className = `list-group-item ${activeClass}`;
            btn.innerHTML = `
                <div class="item-badge">${c.id}</div>
                <div style="flex-grow: 1; text-align: left; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">
                    ${c.title}
                </div>
                ${isRead ? `<span style="color: var(--success); font-size: 16px;">✓</span>` : ''}
            `;
            btn.addEventListener('click', () => {
                state.activeChapterId = c.id;
                renderLearnTab();
            });
            elements.learnChaptersList.appendChild(btn);
        });

        // Render Reader Pane
        const activeChapter = classroomResearchData.chapters.find(c => c.id === state.activeChapterId);
        if (!activeChapter || !elements.learnReaderPane) return;

        const isRead = state.readChapters.includes(activeChapter.id);
        
        // Format summary content nicely into sections
        const formattedContent = formatSummary(activeChapter.summary);

        elements.learnReaderPane.innerHTML = `
            <div class="reader-header">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 12px; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 1px;">ความรู้วิจัยในชั้นเรียน • บทที่ ${activeChapter.id}</span>
                    <span class="quiz-pill" style="background-color: ${isRead ? 'var(--success-light)' : 'var(--bg-primary)'}; color: ${isRead ? 'var(--success)' : 'var(--text-secondary)'}">
                        ${isRead ? 'อ่านแล้ว ✓' : 'ยังไม่ได้อ่าน'}
                    </span>
                </div>
                <h2>${activeChapter.title}</h2>
            </div>
            <div class="reader-content">
                ${formattedContent}
            </div>
            <div class="reader-footer">
                <button class="btn ${isRead ? 'btn-secondary' : 'btn-primary'}" id="reader-mark-read-btn">
                    ${isRead ? '✓ ทำเครื่องหมายว่ายังไม่ได้อ่าน' : '✓ อ่านจบแล้ว ทำเครื่องหมายเสร็จสิ้น'}
                </button>
                <button class="btn btn-secondary" id="reader-quiz-btn" style="border-color: var(--primary); color: var(--primary-light);">
                    📝 ทดสอบความรู้บทนี้
                </button>
            </div>
        `;

        // Attach buttons handlers
        document.getElementById('reader-mark-read-btn').addEventListener('click', () => {
            if (isRead) {
                state.readChapters = state.readChapters.filter(id => id !== activeChapter.id);
            } else {
                state.readChapters.push(activeChapter.id);
            }
            localStorage.setItem('readChapters', JSON.stringify(state.readChapters));
            renderLearnTab();
        });

        document.getElementById('reader-quiz-btn').addEventListener('click', () => {
            startChapterQuiz(activeChapter.id);
        });
    }

    // Helper to format textbook summary
    function formatSummary(text) {
        if (!text) return '';
        // Remove textbook visual dividers
        let cleanText = text.replace(/📝+/g, '').trim();
        
        // Split by lines
        const lines = cleanText.split('\n');
        let html = '';
        let listOpen = false;

        lines.forEach(line => {
            line = line.trim();
            if (line.length === 0) return;

            // Check if it's a primary section header (e.g. 1. บทนำ, 2. แนวคิด...)
            if (/^\d+\.\s*(.*)$/.test(line)) {
                if (listOpen) {
                    html += '</ul>';
                    listOpen = false;
                }
                html += `<h3 style="font-size: 20px; font-weight: 700; color: var(--primary-light); margin-top: 32px; border-bottom: 1px solid var(--border); padding-bottom: 8px; margin-bottom: 16px;">${line}</h3>`;
            }
            // Check if it's a sub-header (looks like a bold text title)
            else if (line.length < 80 && /^(ความหมาย|แนวคิด|การส่งเสริม|การบูรณาการ|กระบวนการ|ประโยชน์|ข้อจำกัด|แนวทาง|วิธีการ|ตัวอย่าง|บทเรียน|ประเภท|องค์ประกอบ|หลักสำคัญ|ค้นหา|หลีกเลี่ยง|การแปล|การจัด|แหล่ง|ขอบเขต|หลักเกณฑ์|เทคนิค|นิยาม|ค่าของ|การใช้|วิธี|ความตรง|ความเที่ยง|ระดับ|สถิติ|บทบาท|ระยะเวลา|การทบทวน|เครื่องมือ|การวิเคราะห์|สรุป)/.test(line)) {
                if (listOpen) {
                    html += '</ul>';
                    listOpen = false;
                }
                html += `<h4 style="font-size: 16px; font-weight: 600; color: var(--accent); margin-top: 20px; margin-bottom: 8px;">${line}</h4>`;
            }
            // Check if it's a bullet point (starts with - or bullet symbol)
            else if (line.startsWith('-') || line.startsWith('•') || /^\-\s*(.*)$/.test(line)) {
                if (!listOpen) {
                    html += '<ul style="margin-bottom: 16px; padding-left: 20px; line-height: 1.8;">';
                    listOpen = true;
                }
                const cleanItem = line.replace(/^[\-\•]\s*/, '');
                html += `<li style="margin-bottom: 8px; color: var(--text-secondary);">${cleanItem}</li>`;
            } 
            // Normal paragraph
            else {
                if (listOpen) {
                    html += '</ul>';
                    listOpen = false;
                }
                html += `<p style="margin-bottom: 16px; text-indent: 24px; text-align: justify; color: var(--text-primary); font-size: 15px;">${line}</p>`;
            }
        });

        if (listOpen) {
            html += '</ul>';
        }

        return html;
    }

    // ----------------------------------------------------
    // PRACTICE TEST CENTER TAB CONTROLLER (QUIZ)
    // ----------------------------------------------------
    function renderQuizTab() {
        if (state.activeQuiz.isActive) {
            renderActiveQuiz();
            return;
        }

        elements.quizMainView.style.display = 'block';
        elements.quizActiveView.style.display = 'none';
        elements.quizResultView.style.display = 'none';

        if (!elements.quizChaptersList) return;

        // Render chapter selector for Quizzes
        elements.quizChaptersList.innerHTML = '';
        classroomResearchData.chapters.forEach(c => {
            const highScore = state.quizHighScores[c.id];
            
            const card = document.createElement('div');
            card.className = 'quiz-opt-card';
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <span class="item-badge" style="background-color: var(--primary); color: white; width: 32px; height: 32px; border-radius: 8px; font-size: 14px;">${c.id}</span>
                    ${highScore !== undefined ? `<span class="quiz-pill" style="background-color: var(--success-light); color: var(--success);">คะแนนสูงสุด: ${highScore}%</span>` : ''}
                </div>
                <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 6px;">${c.title}</h3>
                <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 16px;">ทำข้อสอบประจำบทเรียน จำนวน ${c.questions.Count} ข้อ</p>
                <button class="btn btn-secondary" style="width: 100%; font-size: 12px;" onclick="window.appActions.startQuiz(${c.id})">เริ่มทำข้อสอบ</button>
            `;
            elements.quizChaptersList.appendChild(card);
        });

        // Set handler for Mock Exam
        elements.mockExamBtn.onclick = () => {
            startMockExam();
        };
    }

    function startChapterQuiz(chapterId) {
        const chapter = classroomResearchData.chapters.find(c => c.id === chapterId);
        if (!chapter || !chapter.questions || chapter.questions.Count === 0) return;
        
        // Setup state
        state.activeQuiz.isActive = true;
        state.activeQuiz.chapterId = chapterId;
        state.activeQuiz.currentIndex = 0;
        state.activeQuiz.score = 0;
        state.activeQuiz.selectedAnswer = null;
        state.activeQuiz.isAnswered = false;
        state.activeQuiz.startTime = new Date();
        state.activeQuiz.elapsedSeconds = 0;
        state.activeQuiz.userAnswers = [];
        
        // Deep copy questions and shuffle them for better experience
        const qList = JSON.parse(JSON.stringify(chapter.questions));
        state.activeQuiz.questions = shuffleArray(qList);

        switchTab('quiz');
        startTimer();
        renderActiveQuiz();
    }

    function startMockExam() {
        // Collect all questions from all chapters
        let allQuestions = [];
        classroomResearchData.chapters.forEach(c => {
            if (c.questions && c.questions.Count > 0) {
                // Add chapter context to each question
                c.questions.forEach(q => {
                    const qCopy = JSON.parse(JSON.stringify(q));
                    qCopy.chapterTitle = c.title;
                    qCopy.chapterId = c.id;
                    allQuestions.push(qCopy);
                });
            }
        });

        if (allQuestions.length === 0) return;

        // Shuffle and take 30 questions
        const shuffled = shuffleArray(allQuestions);
        state.activeQuiz.questions = shuffled.slice(0, 30);

        // Setup state
        state.activeQuiz.isActive = true;
        state.activeQuiz.chapterId = null; // null represents full mock
        state.activeQuiz.currentIndex = 0;
        state.activeQuiz.score = 0;
        state.activeQuiz.selectedAnswer = null;
        state.activeQuiz.isAnswered = false;
        state.activeQuiz.startTime = new Date();
        state.activeQuiz.elapsedSeconds = 0;
        state.activeQuiz.userAnswers = [];

        elements.quizMainView.style.display = 'none';
        elements.quizActiveView.style.display = 'block';
        elements.quizResultView.style.display = 'none';

        startTimer();
        renderActiveQuiz();
    }

    // Shuffler
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Timer functions
    function startTimer() {
        if (state.activeQuiz.timerInterval) {
            clearInterval(state.activeQuiz.timerInterval);
        }
        state.activeQuiz.startTime = new Date();
        state.activeQuiz.elapsedSeconds = 0;
        state.activeQuiz.timerInterval = setInterval(() => {
            state.activeQuiz.elapsedSeconds++;
            updateTimerDisplay();
        }, 1000);
    }

    function stopTimer() {
        if (state.activeQuiz.timerInterval) {
            clearInterval(state.activeQuiz.timerInterval);
            state.activeQuiz.timerInterval = null;
        }
    }

    function updateTimerDisplay() {
        const timeDisplay = document.getElementById('quiz-timer-display');
        if (!timeDisplay) return;

        const minutes = Math.floor(state.activeQuiz.elapsedSeconds / 60);
        const seconds = state.activeQuiz.elapsedSeconds % 60;
        const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        timeDisplay.textContent = `เวลา: ${formatted}`;
    }

    function renderActiveQuiz() {
        elements.quizMainView.style.display = 'none';
        elements.quizActiveView.style.display = 'block';
        elements.quizResultView.style.display = 'none';

        const quiz = state.activeQuiz;
        const currentQuestion = quiz.questions[quiz.currentIndex];
        if (!currentQuestion) return;

        // Progress bar
        const totalQ = quiz.questions.length;
        const currentNum = quiz.currentIndex + 1;
        const progressPercent = Math.round(((currentNum - 1) / totalQ) * 100);
        
        const progressBar = document.getElementById('quiz-progress-bar');
        if (progressBar) progressBar.style.width = `${progressPercent}%`;

        // Stats Header
        const qNumDisplay = document.getElementById('quiz-qnum-display');
        const scoreDisplay = document.getElementById('quiz-score-display');
        if (qNumDisplay) {
            const chapterContext = quiz.chapterId ? `บทที่ ${quiz.chapterId}` : 'ข้อสอบจำลอง';
            qNumDisplay.textContent = `${chapterContext} • ข้อที่ ${currentNum}/${totalQ}`;
        }
        if (scoreDisplay) scoreDisplay.textContent = `คะแนน: ${quiz.score}`;
        updateTimerDisplay();

        // Render Question Text
        const qTextDiv = document.getElementById('quiz-question-text');
        if (qTextDiv) {
            qTextDiv.innerHTML = '';
            if (currentQuestion.chapterTitle) {
                const subContext = document.createElement('div');
                subContext.style.fontSize = '12px';
                subContext.style.color = 'var(--text-muted)';
                subContext.style.marginBottom = '6px';
                subContext.textContent = `บทเรียน: ${currentQuestion.chapterTitle}`;
                qTextDiv.appendChild(subContext);
            }
            const mainText = document.createElement('div');
            mainText.textContent = currentQuestion.question;
            qTextDiv.appendChild(mainText);
        }

        // Render Option Buttons
        const optListDiv = document.getElementById('quiz-options-list');
        if (optListDiv) {
            optListDiv.innerHTML = '';
            const opts = currentQuestion.options;
            
            const renderOpt = (key, val, badge) => {
                if (!val) return;
                
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                if (quiz.selectedAnswer === key) btn.classList.add('selected');
                
                // Show correctness colors if answered
                if (quiz.isAnswered) {
                    btn.disabled = true;
                    if (key === currentQuestion.answer) {
                        btn.classList.add('correct');
                    } else if (quiz.selectedAnswer === key) {
                        btn.classList.add('incorrect');
                    }
                } else {
                    btn.addEventListener('click', () => {
                        selectQuizAnswer(key);
                    });
                }

                btn.innerHTML = `
                    <div class="option-badge">${badge}</div>
                    <div style="flex-grow: 1;">${val}</div>
                `;
                optListDiv.appendChild(btn);
            };

            renderOpt('a', opts.a, 'ก');
            renderOpt('b', opts.b, 'ข');
            renderOpt('c', opts.c, 'ค');
            renderOpt('d', opts.d, 'ง');
        }

        // Render Explanation and Actions
        const expDiv = document.getElementById('quiz-explanation-container');
        const submitBtn = document.getElementById('quiz-submit-btn');
        
        if (quiz.isAnswered) {
            expDiv.style.display = 'block';
            expDiv.innerHTML = `
                <div class="explanation-panel">
                    <h4>💡 คำอธิบายเฉลย</h4>
                    <p>${currentQuestion.explanation || 'ไม่มีคำอธิบายสำหรับคำถามข้อนี้'}</p>
                </div>
            `;
            
            // Next or Finish button
            if (quiz.currentIndex < totalQ - 1) {
                submitBtn.textContent = 'ถัดไป ➔';
                submitBtn.onclick = nextQuizQuestion;
            } else {
                submitBtn.textContent = 'สิ้นสุดการทำข้อสอบ ➔';
                submitBtn.onclick = finishQuiz;
            }
            submitBtn.disabled = false;
        } else {
            expDiv.style.display = 'none';
            submitBtn.textContent = 'ตรวจคำตอบ';
            submitBtn.disabled = quiz.selectedAnswer === null;
            submitBtn.onclick = submitQuizAnswer;
        }
    }

    function selectQuizAnswer(answerKey) {
        state.activeQuiz.selectedAnswer = answerKey;
        renderActiveQuiz();
    }

    function submitQuizAnswer() {
        const quiz = state.activeQuiz;
        if (quiz.selectedAnswer === null || quiz.isAnswered) return;

        const currentQuestion = quiz.questions[quiz.currentIndex];
        quiz.isAnswered = true;
        quiz.userAnswers.push(quiz.selectedAnswer);

        if (quiz.selectedAnswer === currentQuestion.answer) {
            quiz.score++;
        }

        renderActiveQuiz();
    }

    function nextQuizQuestion() {
        const quiz = state.activeQuiz;
        quiz.currentIndex++;
        quiz.selectedAnswer = null;
        quiz.isAnswered = false;
        renderActiveQuiz();
    }

    function finishQuiz() {
        stopTimer();
        state.activeQuiz.isActive = false;

        const quiz = state.activeQuiz;
        const totalQuestions = quiz.questions.length;
        const score = quiz.score;
        const percent = Math.round((score / totalQuestions) * 100);

        // Save progress details
        if (quiz.chapterId !== null) {
            // Chapter Quiz score
            const prevBest = state.quizHighScores[quiz.chapterId] || 0;
            if (percent > prevBest) {
                state.quizHighScores[quiz.chapterId] = percent;
                localStorage.setItem('quizHighScores', JSON.stringify(state.quizHighScores));
            }
        } else {
            // Mock Exam score
            state.mockHistory.push({
                date: new Date().toLocaleDateString('th-TH'),
                score: score,
                total: totalQuestions,
                percent: percent,
                timeSeconds: quiz.elapsedSeconds
            });
            localStorage.setItem('mockHistory', JSON.stringify(state.mockHistory));
        }

        renderResultScreen(score, totalQuestions, percent);
    }

    function renderResultScreen(score, total, percent) {
        elements.quizMainView.style.display = 'none';
        elements.quizActiveView.style.display = 'none';
        elements.quizResultView.style.display = 'block';

        if (!elements.quizResultView) return;

        const quiz = state.activeQuiz;
        const incorrectQuestions = [];
        for (let i = 0; i < quiz.questions.length; i++) {
            const q = quiz.questions[i];
            const userAnswer = quiz.userAnswers[i];
            if (userAnswer !== q.answer) {
                incorrectQuestions.push({
                    questionIndex: i + 1,
                    question: q,
                    userAnswer: userAnswer,
                    correctAnswer: q.answer
                });
            }
        }

        let levelWord = 'พยายามใหม่อีกครั้ง';
        let levelColor = 'var(--error)';
        let levelDesc = 'คุณสามารถกลับไปอ่านสรุปบทเรียนและกลับมาทำข้อสอบนี้อีกครั้งเพื่อเพิ่มความมั่นใจ!';
        
        if (percent >= 80) {
            levelWord = 'ยอดเยี่ยมมาก! 🎉';
            levelColor = 'var(--success)';
            levelDesc = 'คุณมีความเข้าใจในเนื้อหาบทเรียนนี้เป็นอย่างดีเยี่ยม พร้อมสำหรับการทดสอบจริง!';
        } else if (percent >= 50) {
            levelWord = 'ผ่านเกณฑ์ขั้นต่ำ 👍';
            levelColor = 'var(--accent)';
            levelDesc = 'คุณเข้าใจแนวคิดสำคัญได้ดี แนะนำให้ทบทวนข้อที่ตอบผิดเพื่อคะแนนที่ดียิ่งขึ้น';
        }

        // ----------------------------------------------------
        // Assessment for Learning (AfL) Dashboard Logic
        // ----------------------------------------------------
        let aflContent = '';
        if (quiz.chapterId === null) {
            // Mock Exam - Group by Chapter
            const chapterAnalysis = {};
            classroomResearchData.chapters.forEach(c => {
                chapterAnalysis[c.id] = {
                    id: c.id,
                    title: c.title,
                    total: 0,
                    correct: 0
                };
            });

            for (let i = 0; i < quiz.questions.length; i++) {
                const q = quiz.questions[i];
                const userAnswer = quiz.userAnswers[i];
                const chId = q.chapterId;
                if (chId && chapterAnalysis[chId]) {
                    chapterAnalysis[chId].total++;
                    if (userAnswer === q.answer) {
                        chapterAnalysis[chId].correct++;
                    }
                }
            }

            aflContent += `
                <div style="margin-top: 32px; width: 100%; text-align: left;">
                    <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 8px; color: var(--primary-light);">📊 Assessment for Learning (วิเคราะห์รายบทเรียน)</h3>
                    <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">สัดส่วนความเข้าในแต่ละบทเรียน เพื่อคุณครูจะได้เลือกเจาะลึกบทเรียนเฉพาะจุดที่ยังไม่แม่นยำ:</p>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 12px; max-height: 350px; overflow-y: auto; padding-right: 8px;">
            `;
            
            Object.values(chapterAnalysis).forEach(ch => {
                if (ch.total === 0) return;
                const pct = Math.round((ch.correct / ch.total) * 100);
                let statusBadge = 'ต้องทบทวนด่วน 🔴';
                let statusColor = 'var(--error)';
                if (pct >= 80) {
                    statusBadge = 'ดีเยี่ยม 🟢';
                    statusColor = 'var(--success)';
                } else if (pct >= 50) {
                    statusBadge = 'พอใช้ 🟡';
                    statusColor = 'var(--accent)';
                }
                
                aflContent += `
                    <div style="background-color: var(--bg-secondary); border: 1px solid var(--border); border-radius: 12px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                        <div style="flex-grow: 1; min-width: 0;">
                            <h4 style="font-size: 13px; font-weight: 600; margin-bottom: 2px; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">บทที่ ${ch.id}: ${ch.title}</h4>
                            <p style="font-size: 11px; color: var(--text-muted);">ทำถูก ${ch.correct}/${ch.total} ข้อ (${pct}%)</p>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                            <span style="font-size: 11px; font-weight: 600; color: ${statusColor}">${statusBadge}</span>
                            <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px; border-color: var(--primary);" onclick="window.appActions.openChapter(${ch.id})">อ่าน 📖</button>
                        </div>
                    </div>
                `;
            });
            
            aflContent += `
                    </div>
                </div>
            `;
        } else {
            // Chapter Quiz - Review Incorrect Questions
            aflContent += `
                <div style="margin-top: 32px; width: 100%; text-align: left;">
                    <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 8px; color: var(--primary-light);">📊 Assessment for Learning (วิเคราะห์ข้อสอบที่ตอบผิด)</h3>
            `;
            
            if (incorrectQuestions.length === 0) {
                aflContent += `
                    <div style="background-color: var(--success-light); border: 1px solid var(--success); border-radius: 12px; padding: 20px; text-align: center; color: var(--success); font-weight: 600; margin-bottom: 16px;">
                        🎉 ยอดเยี่ยมมาก! คุณตอบถูกครบทุกข้อ (100% Accuracy) มีความรู้ที่สมบูรณ์แบบในบทเรียนนี้
                    </div>
                `;
            } else {
                aflContent += `
                    <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">รายละเอียดคำถามที่คุณตอบผิด ${incorrectQuestions.length} ข้อ เพื่อทบทวนและทำความเข้าใจจุดที่เข้าใจคลาดเคลื่อน:</p>
                    <div style="display: flex; flex-direction: column; gap: 12px; max-height: 350px; overflow-y: auto; padding-right: 8px; margin-bottom: 16px;">
                `;
                
                const optMap = { a: 'ก', b: 'ข', c: 'ค', d: 'ง' };
                incorrectQuestions.forEach(item => {
                    const q = item.question;
                    const userAnswerText = q.options[item.userAnswer] || '';
                    const correctAnswerText = q.options[item.correctAnswer] || '';
                    
                    aflContent += `
                        <details style="background-color: var(--bg-secondary); border: 1px solid var(--border); border-radius: 10px; padding: 12px; cursor: pointer;">
                            <summary style="font-weight: 600; font-size: 13px; color: var(--text-primary); outline: none;">
                                ข้อที่ ${item.questionIndex}: ${q.question.substring(0, 75)}${q.question.length > 75 ? '...' : ''} <span style="color: var(--error); font-size: 12px;">❌ (คลิกทบทวนเฉลย)</span>
                            </summary>
                            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); font-size: 13px; cursor: default;" onclick="event.stopPropagation();">
                                <p style="font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">คำถามเต็ม: <span style="font-weight: normal;">${q.question}</span></p>
                                <p style="color: var(--error); margin-bottom: 4px;">❌ คำตอบของคุณ: <strong>${optMap[item.userAnswer]}.</strong> ${userAnswerText}</p>
                                <p style="color: var(--success); margin-bottom: 12px;">✓ คำตอบที่ถูกต้อง: <strong>${optMap[item.correctAnswer]}.</strong> ${correctAnswerText}</p>
                                <div style="background-color: var(--surface); padding: 12px; border-radius: 6px; border-left: 3px solid var(--primary);">
                                    <strong style="color: var(--primary-light); font-size: 12px; display: block; margin-bottom: 4px;">คำอธิบายเฉลย:</strong>
                                    <span style="color: var(--text-secondary); line-height: 1.5; font-size: 12.5px;">${q.explanation || 'ไม่มีคำอธิบาย'}</span>
                                </div>
                            </div>
                        </details>
                    `;
                });
                
                aflContent += `
                    </div>
                `;
            }
            aflContent += `
                </div>
            `;
        }

        // Append actionable recommendations
        aflContent += `
            <div style="background-color: rgba(99, 102, 241, 0.05); border: 1px dashed var(--primary); border-radius: 12px; padding: 16px; text-align: left; width: 100%; margin: 16px 0 24px 0;">
                <h4 style="font-size: 13px; font-weight: 700; color: var(--primary-light); margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">🎯 คำแนะนำเพื่อพัฒนาการเรียนรู้</h4>
                <ul style="font-size: 12px; color: var(--text-secondary); padding-left: 16px; line-height: 1.6;">
                    <li><strong>ทบทวนเชิงรุก:</strong> คลิกปุ่ม "อ่าน 📖" หรือลิ้งก์เปิดอ่านสรุปบทเรียนในส่วนที่ตอบผิดเพื่อปิดจุดบกพร่องทันที</li>
                    <li><strong>ทดสอบซ้ำ (Formative Re-evaluation):</strong> แนะนำให้กลับไปทบทวนสรุปเนื้อหาบทเรียน แล้วกลับมาทำสอบซ้ำเพื่อสร้างความจำระยะยาว</li>
                    <li><strong>เชื่อมโยงเกณฑ์วิทยฐานะ:</strong> สังเกตว่าหัวข้อที่ทำได้ดี เชื่อมโยงกับข้อกำหนดการวิจัยในแท็บ "คู่มือวิทยฐานะ" อย่างไรเพื่อเตรียมทำผลงานจริง</li>
                </ul>
            </div>
        `;

        elements.quizResultView.innerHTML = `
            <div class="quiz-result-view" style="max-width: 700px;">
                <div class="result-circle">
                    <span class="result-score">${percent}%</span>
                    <span class="result-total">${score}/${total} คะแนน</span>
                </div>
                <h2 class="result-heading" style="color: ${levelColor}">${levelWord}</h2>
                <p class="result-desc">${levelDesc}</p>
                
                <div style="width: 100%; background-color: var(--bg-secondary); border: 1px solid var(--border); border-radius: 12px; padding: 16px 20px; text-align: left; margin: 10px 0; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4 style="font-size: 12px; font-weight: 700; color: var(--text-muted); margin-bottom: 2px;">⏱ เวลาที่ใช้ทำข้อสอบ</h4>
                        <p style="font-size: 16px; font-weight: 600; color: var(--text-primary);">
                            ${Math.floor(state.activeQuiz.elapsedSeconds / 60)} นาที ${state.activeQuiz.elapsedSeconds % 60} วินาที
                        </p>
                    </div>
                    <div>
                        <h4 style="font-size: 12px; font-weight: 700; color: var(--text-muted); margin-bottom: 2px;">📚 โหมดการสอบ</h4>
                        <p style="font-size: 16px; font-weight: 600; color: var(--primary-light);">
                            ${quiz.chapterId ? 'แบบทดสอบรายบท' : 'ข้อสอบจำลองเสมือนจริง'}
                        </p>
                    </div>
                </div>

                ${aflContent}

                <div style="display: flex; gap: 16px; width: 100%;">
                    <button class="btn btn-primary" style="flex: 1;" onclick="window.appActions.resetQuizView()">ทำข้อสอบชุดอื่น</button>
                    <button class="btn btn-secondary" style="flex: 1;" onclick="window.appActions.goToDashboard()">กลับสู่แดชบอร์ด</button>
                </div>
            </div>
        `;
    }

    // ----------------------------------------------------
    // TEACHER PROMOTION TAB CONTROLLER (วิทยฐานะ)
    // ----------------------------------------------------
    // Structured data from Chapter 12: วิทยฐานะครู
    const promotionData = {
        nomembers: {
            title: 'ครูผู้ช่วย / ครูที่ยังไม่มีวิทยฐานะ',
            role: 'รับผิดชอบการจัดการเรียนการสอนในระดับชั้นเรียน ค้นหาและเตรียมพร้อมแก้ไขปัญหาการเรียนรู้พื้นฐานของนักเรียน',
            scope: 'มุ่งเน้นการทำวิจัยขนาดเล็กเพื่อแก้ไขปัญหาเฉพาะหน้าในระดับห้องเรียน (1 ห้องเรียน) ที่ตนเองจัดการเรียนการสอน',
            duration: 'ระยะเวลาดำเนินงานวิจัยและทดลองนวัตกรรมประมาณ 1 ภาคเรียน',
            literature: 'ใช้เอกสารอ้างอิงและแนวคิดพื้นฐานทั่วไป ไม่เน้นการทบทวนวรรณกรรมเชิงทฤษฎีที่ลึกซึ้ง',
            sample: 'กลุ่มตัวอย่างเป็นนักเรียนในความรับผิดชอบ 1 ห้องเรียน หรือกรณีศึกษารายบุคคล (Case Study)',
            tools: 'เครื่องมือวิจัยระดับพื้นฐาน เช่น แบบทดสอบวัดความรู้ทั่วไป หรือแบบสังเกตพฤติกรรมง่ายๆ',
            analysis: 'ใช้สถิติพื้นฐานในการวิเคราะห์ข้อมูล เช่น ร้อยละ (Percentage) และค่าเฉลี่ย (Mean)',
            presentation: 'นำเสนอและแบ่งปันรายงานวิจัยภายในกลุ่มสาระการเรียนรู้ หรือรายงานผลภายในโรงเรียน',
            advance: 'เป็นก้าวแรกในการสั่งสมทักษะครูนักวิจัยเพื่อเลื่อนวิทยฐานะในลำดับถัดไป'
        },
        professional: {
            title: 'ครูชำนาญการ',
            role: 'เป็นผู้จัดการเรียนรู้และวิชาการในระดับช่วงชั้น บูรณาการกระบวนการสอนร่วมกับงานวิจัยเพื่อยกระดับผลสัมฤทธิ์',
            scope: 'ขยายขอบเขตการทำวิจัยครอบคลุมทั้งรายวิชา หรือหลายกลุ่มผู้เรียนในระดับชั้นเดียวกัน',
            duration: 'ระยะเวลาวางแผนและดำเนินการทดลองนวัตกรรมการสอนประมาณ 1-2 ภาคเรียน',
            literature: 'ทบทวนงานวิจัยและทฤษฎีที่เกี่ยวข้องในสาขาวิชา เพื่อหาเหตุผลและแนวคิดอ้างอิงในการเขียนแผนจัดเรียนรู้',
            sample: 'กลุ่มตัวอย่างเป็นนักเรียนในหลายห้องเรียน หรือเปรียบเทียบผลสัมฤทธิ์ระหว่างชั้นเรียนร่วมกัน',
            tools: 'พัฒนาเครื่องมือวัดระดับก้าวหน้า เช่น แบบสอบถามประเมินเจตคติ และเครื่องมือวัดผลทักษะการปฏิบัติงาน',
            analysis: 'เริ่มใช้สถิติเชิงอนุมานในการตรวจสอบสมมติฐานการวิจัย เช่น t-test เพื่อเปรียบเทียบค่าก่อนเรียน-หลังเรียน',
            presentation: 'นำเสนอและเผยแพร่ผลงานวิจัยในระดับเขตพื้นที่การศึกษา หรือการจัดสัมมนาวิชาการระดับท้องถิ่น',
            advance: 'ใช้ผลวิจัยในการปรับปรุงคุณภาพการเรียนการสอนรายวิชา และพัฒนาเป็นคู่มือนวัตกรรมการเรียนรู้'
        },
        senior: {
            title: 'ครูชำนาญการพิเศษ',
            role: 'มีบทบาทสำคัญในการพัฒนาคุณภาพการศึกษา พัฒนาหลักสูตรการสอน และริเริ่มนวัตกรรมระดับภูมิภาค',
            scope: 'การวิจัยมุ่งเน้นสร้างนวัตกรรมการเรียนรู้เชิงประจักษ์ ครอบคลุมหลายระดับชั้น หรือจัดทำการวิจัยเชิงบูรณาการหลักสูตร',
            duration: 'การวิจัยและติดตามผลการใช้นวัตกรรมการเรียนรู้ต้องดำเนินการอย่างต่อเนื่อง 1 ปีการศึกษา',
            literature: 'ต้องทบทวนวรรณกรรมและกรอบทฤษฎีการวิจัยอย่างเข้มข้นเชิงลึก มีการอ้างอิงถึงทฤษฎีการศึกษาสำคัญ',
            sample: 'กลุ่มตัวอย่างเป็นนักเรียนหลากหลายระดับชั้น ครอบคลุมผู้เรียนที่มีกลุ่มเป้าหมายต่างบริบทกัน',
            tools: 'สร้างและหาประสิทธิภาพของเครื่องมือวิจัยที่หลากหลายและมีคุณภาพสูง เช่น ชุดแบบประเมินสมรรถนะครบวงจร',
            analysis: 'วิเคราะห์ข้อมูลด้วยสถิติขั้นสูง เช่น ANOVA และการวิเคราะห์การถดถอยพหุคูณ (Multiple Regression)',
            presentation: 'นำเสนอผลงานวิจัยในที่ประชุมสัมมนาทางวิชาการระดับจังหวัด หรือระดับภูมิภาค และเผยแพร่ลงวารสารทางการศึกษา',
            advance: 'สร้างสรรค์นวัตกรรมการสอนต้นแบบ (Model) ที่ผู้อื่นสามารถนำไปประยุกต์ใช้งานได้จริง'
        },
        expert: {
            title: 'ครูเชี่ยวชาญ',
            role: 'เป็นผู้นำทางวิชาการระดับสูงของระบบการศึกษา ออกแบบโครงสร้างและทฤษฎีการสอนเชิงนวัตกรรมระดับประเทศ',
            scope: 'ทำวิจัยเชิงลึกเพื่อพัฒนาทฤษฎีการเรียนรู้ หรือแก้ปัญหาเชิงระบบ ครอบคลุมทั้งโรงเรียน หรือกลุ่มโรงเรียนเครือข่าย',
            duration: 'การทดลอง ติดตาม และสังเคราะห์ผลวิจัยระยะยาวมากกว่า 1 ปีการศึกษาขึ้นไป',
            literature: 'ทบทวนวรรณกรรมอย่างกว้างขวาง ทั้งผลงานวิจัยในประเทศและผลงานวิชาการระดับต่างประเทศ',
            sample: 'กลุ่มตัวอย่างขนาดใหญ่ ครอบคลุมกลุ่มประชากรนักเรียนทั้งโรงเรียน หรือครูผู้สอนในสถานศึกษาเครือข่าย',
            tools: 'เครื่องมือวิจัยที่มีความซับซ้อน ได้รับการตรวจสอบความเที่ยงตรง (Validity) และความเชื่อมั่น (Reliability) ระดับมาตรฐานสากล',
            analysis: 'ใช้สถิติขั้นสูงและการวิเคราะห์ข้อมูลเชิงคุณภาพร่วมกัน (Mixed Methods) เพื่อสังเคราะห์องค์ความรู้ใหม่',
            presentation: 'นำเสนอผลงานวิจัยในระดับชาติหรือนานาชาติ เผยแพร่ในวารสารวิชาการที่ยอมรับระดับสากล',
            advance: 'สร้างแนวคิดหรือนวัตกรรมที่เป็นทฤษฎีอ้างอิงใหม่ในวงการศึกษาไทย ส่งเสริมการพัฒนาวิชาชีพครูระดับมหภาค'
        },
        superexpert: {
            title: 'ครูเชี่ยวชาญพิเศษ',
            role: 'ผู้นำวิชาการระดับประเทศและนานาชาติ ริเริ่มและปรับปรุงระบบการผลิตและพัฒนาวิชาชีพครูทั้งประเทศ',
            scope: 'ทำวิจัยเพื่อสร้างการเปลี่ยนแปลงเชิงนโยบายระดับชาติ หรือพัฒนาระบบการศึกษาในวงกว้าง',
            duration: 'โครงการวิจัยระยะยาว หลายปีการศึกษาที่มีการติดตามประเมินผลกระทบเชิงระบบ (Systemic Impact)',
            literature: 'สังเคราะห์องค์ความรู้ใหม่และทฤษฎีจากทั่วโลก เพื่อนำเสนอเป็นกรอบแนวคิดใหม่ในวงการศึกษาสากล',
            sample: 'กลุ่มเป้าหมายเป็นระดับเครือข่ายครูทั้งเขตพื้นที่ หรือผู้มีส่วนเกี่ยวข้องในโครงสร้างการศึกษาทั่วประเทศ',
            tools: 'นวัตกรรมเครื่องมือวิจัยที่ได้รับการยอมรับระดับชาติและผ่านการประเมินประสิทธิภาพจากผู้ทรงคุณวุฒิระดับสากล',
            analysis: 'ใช้การวิเคราะห์ข้อมูลขั้นสูง เช่น Structural Equation Modeling (SEM) หรือ Big Data Analysis',
            presentation: 'บรรยายหลัก (Keynote Speaker) ในการประชุมวิชาการระดับโลก เผยแพร่ผลงานวิจัยในฐานข้อมูลระดับนานาชาติชั้นนำ',
            advance: 'กำหนดและวางแนวทางนโยบายระดับชาติ หรือปฏิรูปโครงสร้างการจัดการเรียนรู้ของประเทศ'
        }
    };

    function renderPromotionTab(levelKey = 'nomembers') {
        // Update level buttons classes
        elements.promoLevelBtns.forEach(btn => {
            if (btn.getAttribute('data-level') === levelKey) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        const level = promotionData[levelKey];
        if (!level) return;

        // Populate detail panels with animation
        elements.promoRole.textContent = level.role;
        elements.promoScope.textContent = level.scope;
        elements.promoDuration.textContent = level.duration;
        elements.promoLiterature.textContent = level.literature;
        elements.promoSample.textContent = level.sample;
        elements.promoTools.textContent = level.tools;
        elements.promoAnalysis.textContent = level.analysis;
        elements.promoPresentation.textContent = level.presentation;
        elements.promoAdvance.textContent = level.advance;
    }

    // Attach level selectors handler
    elements.promoLevelBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const levelKey = btn.getAttribute('data-level');
            renderPromotionTab(levelKey);
        });
    });

    // ----------------------------------------------------
    // REGISTRATION GATEKEEPER & GOOGLE SHEETS INTEGRATION
    // ----------------------------------------------------
    function checkRegistrationState() {
        const profileStr = localStorage.getItem('userProfile');
        const savedUrl = localStorage.getItem('googleSheetsUrl') || 'https://script.google.com/macros/s/AKfycbwO8T0FDk-KwgmzfEfcGT1BIRYtSywRgesPrbexItWm8GF7NsZDMZVrkxcH2Tjri2al/exec';
        
        if (elements.regSheetsUrl) {
            elements.regSheetsUrl.value = savedUrl;
        }

        if (profileStr) {
            try {
                const profile = JSON.parse(profileStr);
                if (profile && profile.fullName && profile.school && profile.email) {
                    // Hide overlay
                    if (elements.registrationOverlay) {
                        elements.registrationOverlay.style.display = 'none';
                    }
                    // Show reset button in sidebar
                    if (elements.sidebarResetProfileBtn) {
                        elements.sidebarResetProfileBtn.style.display = 'block';
                    }
                    // Personalize welcome message
                    if (elements.dbWelcomeTitle) {
                        elements.dbWelcomeTitle.innerHTML = `สวัสดีครับ คุณครู ${profile.fullName} (${profile.school}) 🧑‍🏫`;
                    }
                    
                    // Render current state
                    renderDashboard();
                    return;
                }
            } catch (e) {
                console.error("Error parsing userProfile:", e);
            }
        }

        // Lock App (Show overlay, hide reset button)
        if (elements.registrationOverlay) {
            elements.registrationOverlay.style.display = 'flex';
        }
        if (elements.sidebarResetProfileBtn) {
            elements.sidebarResetProfileBtn.style.display = 'none';
        }
    }

    function submitRegistration() {
        const fullName = elements.regName.value.trim();
        const school = elements.regSchool.value.trim();
        const email = elements.regEmail.value.trim();
        const sheetsUrl = elements.regSheetsUrl ? elements.regSheetsUrl.value.trim() : '';

        let hasError = false;

        // Validation
        if (fullName.length < 3) {
            elements.regName.classList.add('error');
            hasError = true;
        }
        if (school.length < 3) {
            elements.regSchool.classList.add('error');
            hasError = true;
        }
        // Basic email check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            elements.regEmail.classList.add('error');
            hasError = true;
        }

        if (hasError) return;

        // Save profile
        const profile = { fullName, school, email };
        localStorage.setItem('userProfile', JSON.stringify(profile));

        // Submit to Google Sheet (if URL provided)
        if (sheetsUrl) {
            localStorage.setItem('googleSheetsUrl', sheetsUrl);
            const params = new URLSearchParams({
                fullName: fullName,
                school: school,
                email: email
            });
            const syncUrl = sheetsUrl.includes('?') ? `${sheetsUrl}&${params.toString()}` : `${sheetsUrl}?${params.toString()}`;
            
            // Fire-and-forget submission using no-cors to bypass browser CORS block for local files
            fetch(syncUrl, {
                method: 'GET',
                mode: 'no-cors'
            }).catch(err => {
                console.warn("Google Sheets synchronization call issued.", err);
            });
        }

        checkRegistrationState();
    }

    function resetUserProfile() {
        if (confirm("คุณต้องการออกจากระบบใช่หรือไม่? (ข้อมูลส่วนตัวและประวัติการเรียนทั้งหมดจะถูกลบออกอย่างถาวร)")) {
            // Clear localStorage progress & profile
            localStorage.removeItem('userProfile');
            localStorage.removeItem('readChapters');
            localStorage.removeItem('quizHighScores');
            localStorage.removeItem('mockHistory');

            // Reset in-memory state
            state.readChapters = [];
            state.quizHighScores = {};
            state.mockHistory = [];

            // Clear form inputs completely
            if (elements.regName) elements.regName.value = '';
            if (elements.regSchool) elements.regSchool.value = '';
            if (elements.regEmail) elements.regEmail.value = '';

            checkRegistrationState();
        }
    }

    // Input listeners to remove error highlights
    [elements.regName, elements.regSchool, elements.regEmail].forEach(input => {
        if (input) {
            input.addEventListener('input', () => {
                input.classList.remove('error');
            });
        }
    });

    // ----------------------------------------------------
    // INITIAL APP ACTIONS FOR WINDOW ATTACHMENT
    // ----------------------------------------------------
    window.appActions = {
        openChapter: (chapterId) => {
            state.activeChapterId = chapterId;
            switchTab('learn');
        },
        startQuiz: (chapterId) => {
            startChapterQuiz(chapterId);
        },
        resetQuizView: () => {
            state.activeQuiz.isActive = false;
            renderQuizTab();
        },
        goToDashboard: () => {
            state.activeQuiz.isActive = false;
            switchTab('dashboard');
        }
    };

    // Initial Load - Check Registration Gatekeeper
    checkRegistrationState();
});
