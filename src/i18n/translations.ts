export type Lang = 'ru' | 'pl' | 'en';

const ru = {
  // Nav
  nav_home: 'Главная', nav_projects: 'Проекты', nav_transport: 'Транспорт',
  nav_cargo: 'Грузы', nav_optimization: 'Оптимизация', nav_results: 'Результаты',
  nav_settings: 'Настройки', nav_admin: 'Админ', nav_logout: 'Выйти',

  // Dashboard
  dash_title: 'Главная', dash_subtitle: 'Обзор ваших проектов и последних действий',
  dash_new_project: 'Новый проект', dash_stat_projects: 'Проекты',
  dash_stat_active: 'активных', dash_stat_transport: 'Транспорт',
  dash_stat_cargo: 'Грузы', dash_stat_fill: 'Заполненность',
  dash_recent: 'Последние проекты', dash_all: 'Все проекты',
  dash_quick: 'Быстрая оптимизация',
  dash_quick_sub: 'Создайте новую оптимизацию за несколько шагов',
  dash_drag: 'Перетащите грузы сюда', dash_or_file: 'или выберите файл',
  dash_create_opt: 'Создать оптимизацию', dash_3d: '3D превью', dash_soon: 'скоро',

  // Modal
  modal_title: 'Новый проект', modal_name: 'Название проекта',
  modal_placeholder: 'Например: Доставка мебели', modal_vehicle: 'Выберите транспорт',
  modal_cancel: 'Отмена', modal_create: 'Создать проект',
  modal_up_to: 'до', modal_kg: 'кг', modal_m: 'м',

  // Header
  header_save: 'Сохранить проект', header_export: 'Экспорт',
  header_last_save: 'Последнее сохранение: сегодня, 14:32',

  // LeftPanel
  left_vehicle: 'Выбор транспорта', left_length: 'Длина', left_width: 'Ширина',
  left_height: 'Высота', left_mm: 'мм', left_capacity: 'Грузоподъемность',
  left_add: 'Добавить груз', left_box: 'Коробка', left_pallet: 'Палета',
  left_length_mm: 'Длина (мм)', left_width_mm: 'Ширина (мм)',
  left_height_mm: 'Высота (мм)', left_weight_kg: 'Вес (кг)', left_qty: 'Количество',
  left_list: 'Список грузов', left_total_weight: 'Общий вес', left_total_items: 'Всего мест',
  left_err_dim_length: 'длина', left_err_dim_width: 'ширина', left_err_dim_height: 'высота',
  left_err_oversize: 'Не влезет', left_err_volume: 'Не хватает места в кузове (объём превышен)',

  // RightPanel
  right_title: 'Результат оптимизации', right_optimal: 'Оптимально',
  right_partial: 'Частично', right_low: 'Мало груза', right_occupied: 'Занято пространства',
  right_volume: 'Используемый объем', right_weight: 'Общий вес',
  right_places: 'Количество мест', right_free: 'Свободный объем',
  right_optimize: 'Запустить оптимизацию', right_optimizing: 'Оптимизация...',
  right_placed: 'Размещённые грузы', right_actions: 'Действия',
  right_clear: 'Очистить загрузку', right_report: 'Сгенерировать отчет',

  // Auth
  auth_welcome: 'Добро пожаловать!', auth_welcome_sub: 'Войдите в свою учётную запись для продолжения работы',
  auth_register_title: 'Создать аккаунт', auth_register_sub: 'Зарегистрируйтесь и начните планировать загрузку',
  auth_name: 'Имя', auth_name_placeholder: 'Иван Иванов',
  auth_email: 'Email', auth_password: 'Пароль',
  auth_remember: 'Запомнить меня', auth_forgot: 'Забыли пароль?',
  auth_login_btn: 'Войти', auth_register_btn: 'Создать аккаунт',
  auth_or_via: 'или войдите через',
  auth_no_account: 'Нет аккаунта?', auth_have_account: 'Уже есть аккаунт?',
  auth_go_register: 'Зарегистрируйтесь', auth_go_login: 'Войти',
  auth_hero_title: 'Умная оптимизация загрузки',
  auth_hero_sub: 'Алгоритм Extreme Point автоматически рассчитывает оптимальное размещение грузов',

  // Settings
  settings_title: 'Настройки', settings_lang: 'Язык интерфейса',
  settings_theme: 'Тема оформления', settings_light: 'Светлая',
  settings_dark: 'Тёмная', settings_light_desc: 'Чистый светлый интерфейс',
  settings_dark_desc: 'Тёмный интерфейс, меньше нагрузки на глаза',
  settings_saved: 'Настройки сохраняются автоматически',
};

const pl: typeof ru = {
  nav_home: 'Strona główna', nav_projects: 'Projekty', nav_transport: 'Transport',
  nav_cargo: 'Ładunki', nav_optimization: 'Optymalizacja', nav_results: 'Wyniki',
  nav_settings: 'Ustawienia', nav_admin: 'Admin', nav_logout: 'Wyloguj',

  dash_title: 'Strona główna', dash_subtitle: 'Przegląd projektów i ostatnich działań',
  dash_new_project: 'Nowy projekt', dash_stat_projects: 'Projekty',
  dash_stat_active: 'aktywnych', dash_stat_transport: 'Transport',
  dash_stat_cargo: 'Ładunki', dash_stat_fill: 'Wypełnienie',
  dash_recent: 'Ostatnie projekty', dash_all: 'Wszystkie projekty',
  dash_quick: 'Szybka optymalizacja',
  dash_quick_sub: 'Utwórz nową optymalizację załadunku w kilku krokach',
  dash_drag: 'Przeciągnij ładunki tutaj', dash_or_file: 'lub wybierz plik',
  dash_create_opt: 'Utwórz optymalizację', dash_3d: 'Podgląd 3D', dash_soon: 'wkrótce',

  modal_title: 'Nowy projekt', modal_name: 'Nazwa projektu',
  modal_placeholder: 'Np.: Dostawa mebli', modal_vehicle: 'Wybierz pojazd',
  modal_cancel: 'Anuluj', modal_create: 'Utwórz projekt',
  modal_up_to: 'do', modal_kg: 'kg', modal_m: 'm',

  header_save: 'Zapisz projekt', header_export: 'Eksport',
  header_last_save: 'Ostatni zapis: dzisiaj, 14:32',

  left_vehicle: 'Wybór pojazdu', left_length: 'Długość', left_width: 'Szerokość',
  left_height: 'Wysokość', left_mm: 'mm', left_capacity: 'Ładowność',
  left_add: 'Dodaj ładunek', left_box: 'Pudełko', left_pallet: 'Paleta',
  left_length_mm: 'Długość (mm)', left_width_mm: 'Szerokość (mm)',
  left_height_mm: 'Wysokość (mm)', left_weight_kg: 'Waga (kg)', left_qty: 'Ilość',
  left_list: 'Lista ładunków', left_total_weight: 'Łączna waga', left_total_items: 'Łącznie',
  left_err_dim_length: 'długość', left_err_dim_width: 'szerokość', left_err_dim_height: 'wysokość',
  left_err_oversize: 'Nie mieści się', left_err_volume: 'Brak miejsca w przestrzeni ładunkowej',

  right_title: 'Wynik optymalizacji', right_optimal: 'Optymalnie',
  right_partial: 'Częściowo', right_low: 'Mało ładunku', right_occupied: 'Zajęta przestrzeń',
  right_volume: 'Używana objętość', right_weight: 'Łączna waga',
  right_places: 'Liczba miejsc', right_free: 'Wolna objętość',
  right_optimize: 'Uruchom optymalizację', right_optimizing: 'Optymalizacja...',
  right_placed: 'Rozmieszczone ładunki', right_actions: 'Działania',
  right_clear: 'Wyczyść załadunek', right_report: 'Generuj raport',

  auth_welcome: 'Witamy!', auth_welcome_sub: 'Zaloguj się do swojego konta, aby kontynuować',
  auth_register_title: 'Utwórz konto', auth_register_sub: 'Zarejestruj się i zacznij planować załadunek',
  auth_name: 'Imię', auth_name_placeholder: 'Jan Kowalski',
  auth_email: 'Email', auth_password: 'Hasło',
  auth_remember: 'Zapamiętaj mnie', auth_forgot: 'Zapomniałeś hasła?',
  auth_login_btn: 'Zaloguj się', auth_register_btn: 'Utwórz konto',
  auth_or_via: 'lub zaloguj się przez',
  auth_no_account: 'Nie masz konta?', auth_have_account: 'Masz już konto?',
  auth_go_register: 'Zarejestruj się', auth_go_login: 'Zaloguj się',
  auth_hero_title: 'Inteligentna optymalizacja załadunku',
  auth_hero_sub: 'Algorytm Extreme Point automatycznie oblicza optymalne rozmieszczenie ładunków w pojeździe',

  settings_title: 'Ustawienia', settings_lang: 'Język interfejsu',
  settings_theme: 'Motyw', settings_light: 'Jasny',
  settings_dark: 'Ciemny', settings_light_desc: 'Czysty jasny interfejs',
  settings_dark_desc: 'Ciemny interfejs – mniejsze zmęczenie oczu',
  settings_saved: 'Ustawienia są zapisywane automatycznie',
};

const en: typeof ru = {
  nav_home: 'Home', nav_projects: 'Projects', nav_transport: 'Transport',
  nav_cargo: 'Cargo', nav_optimization: 'Optimization', nav_results: 'Results',
  nav_settings: 'Settings', nav_admin: 'Admin', nav_logout: 'Logout',

  dash_title: 'Home', dash_subtitle: 'Overview of your projects and recent actions',
  dash_new_project: 'New project', dash_stat_projects: 'Projects',
  dash_stat_active: 'active', dash_stat_transport: 'Transport',
  dash_stat_cargo: 'Cargo', dash_stat_fill: 'Fill rate',
  dash_recent: 'Recent projects', dash_all: 'All projects',
  dash_quick: 'Quick optimization',
  dash_quick_sub: 'Create a new load optimization in a few steps',
  dash_drag: 'Drag cargo here', dash_or_file: 'or choose a file',
  dash_create_opt: 'Create optimization', dash_3d: '3D preview', dash_soon: 'soon',

  modal_title: 'New project', modal_name: 'Project name',
  modal_placeholder: 'E.g.: Furniture delivery', modal_vehicle: 'Select vehicle',
  modal_cancel: 'Cancel', modal_create: 'Create project',
  modal_up_to: 'up to', modal_kg: 'kg', modal_m: 'm',

  header_save: 'Save project', header_export: 'Export',
  header_last_save: 'Last saved: today, 14:32',

  left_vehicle: 'Vehicle selection', left_length: 'Length', left_width: 'Width',
  left_height: 'Height', left_mm: 'mm', left_capacity: 'Payload',
  left_add: 'Add cargo', left_box: 'Box', left_pallet: 'Pallet',
  left_length_mm: 'Length (mm)', left_width_mm: 'Width (mm)',
  left_height_mm: 'Height (mm)', left_weight_kg: 'Weight (kg)', left_qty: 'Quantity',
  left_list: 'Cargo list', left_total_weight: 'Total weight', left_total_items: 'Total items',
  left_err_dim_length: 'length', left_err_dim_width: 'width', left_err_dim_height: 'height',
  left_err_oversize: 'Does not fit', left_err_volume: 'Not enough space in cargo area',

  right_title: 'Optimization result', right_optimal: 'Optimal',
  right_partial: 'Partial', right_low: 'Low cargo', right_occupied: 'Space occupied',
  right_volume: 'Used volume', right_weight: 'Total weight',
  right_places: 'Number of items', right_free: 'Free volume',
  right_optimize: 'Run optimization', right_optimizing: 'Optimizing...',
  right_placed: 'Placed cargo', right_actions: 'Actions',
  right_clear: 'Clear load', right_report: 'Generate report',

  auth_welcome: 'Welcome back!', auth_welcome_sub: 'Sign in to your account to continue',
  auth_register_title: 'Create account', auth_register_sub: 'Register and start planning loads',
  auth_name: 'Name', auth_name_placeholder: 'John Doe',
  auth_email: 'Email', auth_password: 'Password',
  auth_remember: 'Remember me', auth_forgot: 'Forgot password?',
  auth_login_btn: 'Sign in', auth_register_btn: 'Create account',
  auth_or_via: 'or sign in with',
  auth_no_account: "Don't have an account?", auth_have_account: 'Already have an account?',
  auth_go_register: 'Register', auth_go_login: 'Sign in',
  auth_hero_title: 'Smart load optimization',
  auth_hero_sub: 'Extreme Point algorithm automatically calculates optimal cargo placement in the vehicle',

  settings_title: 'Settings', settings_lang: 'Interface language',
  settings_theme: 'Theme', settings_light: 'Light',
  settings_dark: 'Dark', settings_light_desc: 'Clean light interface',
  settings_dark_desc: 'Dark interface – easier on the eyes',
  settings_saved: 'Settings are saved automatically',
};

export const TRANSLATIONS: Record<Lang, typeof ru> = { ru, pl, en };
export type Translations = typeof ru;
