// ════════════════════════════════════════════════
// INTERNATIONALIZATION (i18n)
// ════════════════════════════════════════════════

const I18N = {
  currentLang: localStorage.getItem('ll_lang') || 'en',
  
  translations: {
    en: {
      // Navigation
      nav_courses: 'Courses',
      nav_account: 'Account',
      nav_logout: 'Logout',
      
      // Auth
      auth_signin: 'Sign In',
      auth_create_account: 'Create Account',
      auth_email: 'Email',
      auth_password: 'Password',
      auth_name: 'Full Name',
      auth_signin_btn: 'Sign in →',
      auth_create_btn: 'Create account →',
      
      // Sidebar
      side_courses: 'Learning Paths',
      side_graphs: 'Graph Algorithms',
      side_levels: 'Levels',
      side_loading: 'Loading...',
      
      // Welcome
      welcome_title: 'Welcome to LearnLab',
      welcome_subtitle: 'Master data structures and algorithms through interactive coding challenges',
      welcome_select: 'Select a course from the left to begin',
      
      // Graph Page
      graph_title: 'Graph Algorithm Problems',
      graph_subtitle: 'Solve graph algorithm challenges. Each problem has multiple test cases with time and memory limits.',
      graph_back: '← Back to Problems',
      graph_run_tests: 'Run Tests',
      graph_running: 'Running tests...',
      graph_test_results: 'Test Results',
      graph_all_passed: 'All tests passed!',
      graph_failed: 'test(s) failed',
      
      // Account
      acc_settings: 'Account Settings',
      acc_subtitle: 'Manage your profile and track your learning progress',
      acc_profile: '👤 Profile Information',
      acc_progress: '📊 Learning Progress',
      acc_name: 'Name',
      acc_email: 'Email',
      acc_joined: 'Member Since',
      acc_overall: 'Overall Course Progress',
      acc_problems: 'Problem Solving by Difficulty',
      acc_easy: 'Easy',
      acc_medium: 'Medium',
      acc_hard: 'Hard',
      acc_total_problems: 'Overall Problems Solved',
      acc_solved: '🏆 Solved Problems',
      
      // Common
      common_loading: 'Loading...',
      common_error: 'Error',
      common_success: 'Success',
      common_warning: 'Warning',
      common_solution_accepted: 'Solution accepted! 🎉',
      common_enter_code: 'Please write some code',
    },
    ru: {
      nav_courses: 'Курсы',
      nav_account: 'Аккаунт',
      nav_logout: 'Выйти',
      auth_signin: 'Войти',
      auth_create_account: 'Создать аккаунт',
      auth_email: 'Эл. почта',
      auth_password: 'Пароль',
      auth_name: 'Полное имя',
      auth_signin_btn: 'Войти →',
      auth_create_btn: 'Создать аккаунт →',
      side_courses: 'Пути обучения',
      side_graphs: 'Графовые алгоритмы',
      side_levels: 'Уровни',
      side_loading: 'Загрузка...',
      welcome_title: 'Добро пожаловать в LearnLab',
      welcome_subtitle: 'Осваивайте структуры данных и алгоритмы через интерактивные задачи',
      welcome_select: 'Выберите курс слева, чтобы начать',
      graph_title: 'Задачи по графовым алгоритмам',
      graph_subtitle: 'Решайте задачи по графам. У каждой задачи есть несколько тестов с ограничениями по времени и памяти.',
      graph_back: '← К списку задач',
      graph_run_tests: 'Запустить тесты',
      graph_running: 'Запуск тестов...',
      graph_test_results: 'Результаты тестов',
      graph_all_passed: 'Все тесты пройдены!',
      graph_failed: 'тест(ов) не пройдено',
      acc_settings: 'Настройки аккаунта',
      acc_subtitle: 'Управляйте профилем и отслеживайте прогресс обучения',
      acc_profile: '👤 Информация профиля',
      acc_progress: '📊 Прогресс обучения',
      acc_name: 'Имя',
      acc_email: 'Эл. почта',
      acc_joined: 'Дата присоединения',
      acc_overall: 'Общий прогресс курса',
      acc_problems: 'Решение задач по сложности',
      acc_easy: 'Легко',
      acc_medium: 'Средне',
      acc_hard: 'Сложно',
      acc_total_problems: 'Всего решено задач',
      acc_solved: '🏆 Решённые задачи',
      common_loading: 'Загрузка...',
      common_error: 'Ошибка',
      common_success: 'Успех',
      common_warning: 'Предупреждение',
      common_solution_accepted: 'Решение принято! 🎉',
      common_enter_code: 'Пожалуйста, напишите код',
    },
    am: {
      nav_courses: 'Դասընթացներ',
      nav_account: 'Հաշիվ',
      nav_logout: 'Դուրս գալ',
      auth_signin: 'Մուտք գործել',
      auth_create_account: 'Ստեղծել հաշիվ',
      auth_email: 'Էլ. փոստ',
      auth_password: 'Գաղտնաբառ',
      auth_name: 'Անուն Ազգանուն',
      auth_signin_btn: 'Մուտք →',
      auth_create_btn: 'Ստեղծել հաշիվ →',
      side_courses: 'Ուսումնական ուղիներ',
      side_graphs: 'Գրաֆների ալգորիթմներ',
      side_levels: 'Մակարդակներ',
      side_loading: 'Բեռնվում է...',
      welcome_title: 'Բարի գալուստ LearnLab',
      welcome_subtitle: 'Յուրացրեք տվյալների կառուցվածքները և ալգորիթմները ինտերակտիվ խնդիրների միջոցով',
      welcome_select: 'Ընտրեք դասընթաց ձախից սկսելու համար',
      graph_title: 'Գրաֆների ալգորիթմների խնդիրներ',
      graph_subtitle: 'Լուծեք գրաֆների խնդիրներ: Յուրաքանչյուր խնդիր ունի մի քանի թեստեր՝ ժամանակի և հիշողության սահմանափակումներով:',
      graph_back: '← Վերադառնալ խնդիրներին',
      graph_run_tests: 'Գործարկել թեստերը',
      graph_running: 'Թեստերը գործարկվում են...',
      graph_test_results: 'Թեստերի արդյունքները',
      graph_all_passed: 'Բոլոր թեստերը անցել են:',
      graph_failed: 'թեստ ձախողվել է',
      acc_settings: 'Հաշվի կարգավորումներ',
      acc_subtitle: 'Կառավարեք ձեր պրոֆիլը և հետևեք ձեր առաջընթացին',
      acc_profile: '👤 Պրոֆիլի տվյալներ',
      acc_progress: '📊 Ուսումնական առաջընթաց',
      acc_name: 'Անուն',
      acc_email: 'Էլ. փոստ',
      acc_joined: 'Անդամ է դարձել',
      acc_overall: 'Դասընթացի ընդամենը առաջընթաց',
      acc_problems: 'Խնդիրների լուծում ըստ դժվարության',
      acc_easy: 'Հեշտ',
      acc_medium: 'Միջին',
      acc_hard: 'Դժվար',
      acc_total_problems: 'Ընդամենը լուծված խնդիրներ',
      acc_solved: '🏆 Լուծված խնդիրներ',
      common_loading: 'Բեռնվում է...',
      common_error: 'Սխալ',
      common_success: 'Հաջողություն',
      common_warning: 'Զգուշացում',
      common_solution_accepted: 'Լուծումն ընդունված է: 🎉',
      common_enter_code: 'Խնդրում ենք գրել կոդ',
    }
  },

  t(key) {
    return this.translations[this.currentLang][key] || key;
  },

  setLang(lang) {
    if (this.translations[lang]) {
      this.currentLang = lang;
      localStorage.setItem('ll_lang', lang);
      this.updateUI();
    }
  },

  updateUI() {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (el.tagName === 'INPUT' && el.placeholder) {
        el.placeholder = this.t(key);
      } else {
        el.textContent = this.t(key);
      }
    });
    
    // Update active state in selector if exists
    document.querySelectorAll('.lang-opt').forEach(opt => {
      opt.classList.toggle('active', opt.dataset.lang === this.currentLang);
    });

    // Global refresh for dynamic content
    if (typeof buildSidebar === 'function') buildSidebar();
    if (S.currentCourse && S.currentModule) {
        // We might want to reload the module or just update titles
    }
  }
};

// Auto-init i18n when script loads
document.addEventListener('DOMContentLoaded', () => {
    // This will be called after app.js loads
});
