import { createContext, useContext, useState, useCallback } from 'react';

const LANGS = [
  { code: 'fr', label: 'Français', flag: '🇫🇷', rtl: false },
  { code: 'en', label: 'English', flag: '🇬🇧', rtl: false },
  { code: 'ar', label: 'العربية', flag: '🇲🇷', rtl: true },
  { code: 'es', label: 'Español', flag: '🇪🇸', rtl: false },
  { code: 'pt', label: 'Português', flag: '🇧🇷', rtl: false },
];

const dict = {
  // Shell
  online:        { fr:'EN LIGNE', en:'ONLINE', ar:'متصل', es:'EN LÍNEA', pt:'ONLINE' },
  offline:       { fr:'HORS LIGNE', en:'OFFLINE', ar:'غير متصل', es:'SIN CONEXIÓN', pt:'OFFLINE' },
  // Nav
  dashboard:     { fr:'Tableau', en:'Dashboard', ar:'لوحة', es:'Panel', pt:'Painel' },
  jobs:          { fr:'Jobs', en:'Jobs', ar:'المهام', es:'Trabajos', pt:'Missões' },
  scan:          { fr:'Scanner', en:'Scan', ar:'مسح', es:'Escanear', pt:'Scanner' },
  reports:       { fr:'Rapports', en:'Reports', ar:'التقارير', es:'Informes', pt:'Relatórios' },
  profile:       { fr:'Profil', en:'Profile', ar:'الملف', es:'Perfil', pt:'Perfil' },
  // Login
  login:         { fr:'Connexion', en:'Sign In', ar:'تسجيل الدخول', es:'Iniciar Sesión', pt:'Entrar' },
  email:         { fr:'Email', en:'Email', ar:'البريد', es:'Correo', pt:'Email' },
  password:      { fr:'Mot de passe', en:'Password', ar:'كلمة المرور', es:'Contraseña', pt:'Senha' },
  loginBtn:      { fr:'Se connecter', en:'Sign In', ar:'دخول', es:'Entrar', pt:'Entrar' },
  loginError:    { fr:'Identifiants invalides', en:'Invalid credentials', ar:'بيانات خاطئة', es:'Credenciales inválidas', pt:'Credenciais inválidas' },
  // Dashboard
  activeJobs:    { fr:'Jobs Actifs', en:'Active Jobs', ar:'مهام نشطة', es:'Trabajos Activos', pt:'Missões Ativas' },
  myTasks:       { fr:'Mes Tâches', en:'My Tasks', ar:'مهامي', es:'Mis Tareas', pt:'Minhas Tarefas' },
  docsToReview:  { fr:'Docs à Vérifier', en:'Docs to Review', ar:'مستندات للمراجعة', es:'Docs por Revisar', pt:'Docs para Revisar' },
  alerts:        { fr:'Alertes', en:'Alerts', ar:'تنبيهات', es:'Alertas', pt:'Alertas' },
  recentJobs:    { fr:'Jobs Récents', en:'Recent Jobs', ar:'المهام الأخيرة', es:'Trabajos Recientes', pt:'Missões Recentes' },
  quickActions:  { fr:'Actions Rapides', en:'Quick Actions', ar:'إجراءات سريعة', es:'Acciones Rápidas', pt:'Ações Rápidas' },
  newRfc:        { fr:'Nouveau RFC', en:'New RFC', ar:'طلب جديد', es:'Nuevo RFC', pt:'Novo RFC' },
  scanQr:        { fr:'Scanner QR', en:'Scan QR', ar:'مسح QR', es:'Escanear QR', pt:'Escanear QR' },
  fieldReport:   { fr:'Rapport Terrain', en:'Field Report', ar:'تقرير ميداني', es:'Informe Campo', pt:'Relatório Campo' },
  viewAll:       { fr:'Voir tout', en:'View all', ar:'عرض الكل', es:'Ver todo', pt:'Ver tudo' },
  // Job
  jobRef:        { fr:'Référence', en:'Reference', ar:'المرجع', es:'Referencia', pt:'Referência' },
  client:        { fr:'Client', en:'Client', ar:'العميل', es:'Cliente', pt:'Cliente' },
  corridor:      { fr:'Corridor', en:'Corridor', ar:'الممر', es:'Corredor', pt:'Corredor' },
  status:        { fr:'Statut', en:'Status', ar:'الحالة', es:'Estado', pt:'Estado' },
  items:         { fr:'Articles', en:'Items', ar:'العناصر', es:'Artículos', pt:'Itens' },
  documents:     { fr:'Documents', en:'Documents', ar:'المستندات', es:'Documentos', pt:'Documentos' },
  timeline:      { fr:'Chronologie', en:'Timeline', ar:'الجدول الزمني', es:'Cronología', pt:'Cronologia' },
  tracking:      { fr:'Suivi', en:'Tracking', ar:'التتبع', es:'Seguimiento', pt:'Rastreamento' },
  photos:        { fr:'Photos', en:'Photos', ar:'الصور', es:'Fotos', pt:'Fotos' },
  // Scan
  scanTitle:     { fr:'Scanner Universel', en:'Universal Scanner', ar:'الماسح الشامل', es:'Escáner Universal', pt:'Scanner Universal' },
  scanHint:      { fr:'Pointer la caméra vers un QR/code-barres', en:'Point camera at QR/barcode', ar:'وجّه الكاميرا نحو الرمز', es:'Apunte la cámara al código', pt:'Aponte a câmera para o código' },
  manualEntry:   { fr:'Saisie manuelle', en:'Manual entry', ar:'إدخال يدوي', es:'Entrada manual', pt:'Entrada manual' },
  searchPlaceholder: { fr:'JOB-001, ITM-001, CTR-001…', en:'JOB-001, ITM-001, CTR-001…', ar:'JOB-001, ITM-001, CTR-001…', es:'JOB-001, ITM-001, CTR-001…', pt:'JOB-001, ITM-001, CTR-001…' },
  found:         { fr:'Trouvé', en:'Found', ar:'تم العثور', es:'Encontrado', pt:'Encontrado' },
  notFound:      { fr:'Non trouvé', en:'Not found', ar:'غير موجود', es:'No encontrado', pt:'Não encontrado' },
  // Reports
  reportTitle:   { fr:'Rapport Terrain', en:'Field Report', ar:'تقرير ميداني', es:'Informe de Campo', pt:'Relatório de Campo' },
  selectJob:     { fr:'Sélectionner un job', en:'Select a job', ar:'اختر مهمة', es:'Seleccionar trabajo', pt:'Selecionar missão' },
  reportType:    { fr:'Type de rapport', en:'Report type', ar:'نوع التقرير', es:'Tipo de informe', pt:'Tipo de relatório' },
  inspection:    { fr:'Inspection', en:'Inspection', ar:'فحص', es:'Inspección', pt:'Inspeção' },
  collection:    { fr:'Collecte', en:'Collection', ar:'تجميع', es:'Recolección', pt:'Coleta' },
  delivery:      { fr:'Livraison', en:'Delivery', ar:'تسليم', es:'Entrega', pt:'Entrega' },
  incident:      { fr:'Incident', en:'Incident', ar:'حادث', es:'Incidencia', pt:'Incidente' },
  addPhoto:      { fr:'Ajouter photo', en:'Add photo', ar:'إضافة صورة', es:'Añadir foto', pt:'Adicionar foto' },
  notes:         { fr:'Notes', en:'Notes', ar:'ملاحظات', es:'Notas', pt:'Notas' },
  submit:        { fr:'Envoyer', en:'Submit', ar:'إرسال', es:'Enviar', pt:'Enviar' },
  submitted:     { fr:'Rapport envoyé', en:'Report submitted', ar:'تم إرسال التقرير', es:'Informe enviado', pt:'Relatório enviado' },
  // Profile
  language:      { fr:'Langue', en:'Language', ar:'اللغة', es:'Idioma', pt:'Idioma' },
  logout:        { fr:'Déconnexion', en:'Sign Out', ar:'تسجيل الخروج', es:'Cerrar Sesión', pt:'Sair' },
  version:       { fr:'Version', en:'Version', ar:'الإصدار', es:'Versión', pt:'Versão' },
  settings:      { fr:'Paramètres', en:'Settings', ar:'الإعدادات', es:'Configuración', pt:'Configurações' },
  notifications: { fr:'Notifications', en:'Notifications', ar:'الإشعارات', es:'Notificaciones', pt:'Notificações' },
};

const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('clear-lang') || 'fr');
  const isRtl = LANGS.find(l => l.code === lang)?.rtl || false;

  const changeLang = useCallback((code) => {
    setLang(code);
    localStorage.setItem('clear-lang', code);
  }, []);

  const t = useCallback((key) => dict[key]?.[lang] || dict[key]?.en || key, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang: changeLang, t, isRtl, langs: LANGS }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() { return useContext(I18nContext); }
