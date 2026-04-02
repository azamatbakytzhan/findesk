import Link from "next/link";
import {
  BarChart3, Bot, Bell, Upload, Users, Send,
  CheckCircle, ChevronDown, ArrowRight, Zap, Crown,
} from "lucide-react";

// ─── Data ────────────────────────────────────────────────────────────────────

const features = [
  {
    icon:  BarChart3,
    title: "Отчёты за 1 клик",
    desc:  "ДДС, ОПиУ и Баланс строятся автоматически из ваших транзакций. Никакой ручной работы.",
    color: "bg-blue-500/10 text-blue-400",
  },
  {
    icon:  Bot,
    title: "ИИ-агент",
    desc:  'Спросите "Сколько потратили на маркетинг в марте?" — агент ответит с точными цифрами.',
    color: "bg-violet-500/10 text-violet-400",
  },
  {
    icon:  Bell,
    title: "Кассовые разрывы",
    desc:  "Система предупредит о нехватке денег за 14 дней. Успеете принять меры.",
    color: "bg-amber-500/10 text-amber-400",
  },
  {
    icon:  Upload,
    title: "Kaspi и Halyk",
    desc:  "Загрузите выписку — система автоматически определит формат и распределит операции.",
    color: "bg-green-500/10 text-green-400",
  },
  {
    icon:  Users,
    title: "Команда",
    desc:  "Пригласите бухгалтера и менеджеров. Гибкие роли: кто видит, кто вносит, кто согласует.",
    color: "bg-pink-500/10 text-pink-400",
  },
  {
    icon:  Send,
    title: "Telegram",
    desc:  "Согласуйте платежи прямо в Telegram — одним нажатием, не заходя в систему.",
    color: "bg-cyan-500/10 text-cyan-400",
  },
];

const steps = [
  { n: "01", title: "Подключите счёт",     desc: "Загрузите выписку Kaspi или Halyk, или внесите первые транзакции вручную." },
  { n: "02", title: "Система распределит", desc: "Автоматизация и ИИ разнесут операции по статьям ДДС, ОПиУ и Балансу." },
  { n: "03", title: "Получайте отчёты",    desc: "ДДС, ОПиУ, прогноз кассовых разрывов и недельный email-дайджест готовы." },
];

const plans = [
  {
    key:      "START",
    name:     "Start",
    price:    "Бесплатно",
    icon:     null,
    features: ["До 3 пользователей", "До 3 счетов", "Базовый импорт CSV", "Отчёты ДДС и ОПиУ"],
    cta:      "Начать бесплатно",
    highlight: false,
  },
  {
    key:      "BUSINESS",
    name:     "Business",
    price:    "29 900 ₸/мес",
    icon:     Zap,
    features: ["До 10 пользователей", "ИИ-агент", "Telegram-уведомления", "Email-дайджест", "Согласование платежей", "Бюджетирование plan/fact", "Kaspi / Halyk импорт"],
    cta:      "Попробовать 14 дней",
    highlight: true,
  },
  {
    key:      "FIRST",
    name:     "First",
    price:    "99 900 ₸/мес",
    icon:     Crown,
    features: ["Безлимитные пользователи", "Всё из Business", "API-доступ", "Приоритетная поддержка", "Персональный менеджер"],
    cta:      "Связаться",
    highlight: false,
  },
];

const faq = [
  { q: "Чем отличается от Excel?",                a: "Excel не умеет автоматически строить ОПиУ, не предупреждает о кассовых разрывах и не отвечает на вопросы по вашим данным." },
  { q: "Нужен ли программист для настройки?",     a: "Нет. Загрузите выписку из Kaspi или внесите первую транзакцию — система готова к работе через 5 минут." },
  { q: "Безопасно ли хранить финансовые данные?", a: "Данные хранятся на серверах Supabase (Frankfurt). Шифрование в покое и при передаче. Ежедневные бэкапы." },
  { q: "Подходит ли для строительных компаний?",  a: "Да. Учёт по проектам, согласование платежей и план-факт анализ — именно то, что нужно в строительстве." },
  { q: "Можно ли вести несколько ТОО / ИП?",      a: "На тарифе Бизнес — 2 юр. лица, на Первом — 3 и больше." },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="bg-slate-950 text-white min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-slate-950/80 backdrop-blur border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-bold text-lg text-white">
            <span className="text-[#1A56DB]">Fin</span>desk
          </span>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Возможности</a>
            <a href="#how"      className="hover:text-white transition-colors">Как работает</a>
            <a href="#pricing"  className="hover:text-white transition-colors">Тарифы</a>
            <a href="#faq"      className="hover:text-white transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login"    className="text-sm text-slate-400 hover:text-white transition-colors">Войти</Link>
            <Link href="/register" className="text-sm px-4 py-2 bg-[#1A56DB] hover:bg-[#1A56DB]/90 rounded-lg transition-colors font-medium">
              Попробовать
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex items-center pt-16 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        <div className="max-w-7xl mx-auto px-6 py-24 text-center w-full">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-6">
            🇰🇿 Сделано для бизнеса Казахстана
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Финансовый учёт<br />
            <span className="text-blue-400">с ИИ-агентом</span>
          </h1>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Держите деньги компании под контролем. ДДС, ОПиУ, Баланс — автоматически.
            Задайте вопрос ИИ — получите ответ с цифрами.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1A56DB] hover:bg-[#1A56DB]/90 rounded-xl font-semibold text-white transition-colors text-lg"
            >
              Попробовать бесплатно — 14 дней <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 px-6 py-3 border border-white/20 hover:border-white/40 rounded-xl font-medium text-white transition-colors text-lg"
            >
              Смотреть возможности
            </a>
          </div>
          <p className="text-slate-500 text-sm mt-4">Без привязки карты. Все функции открыты.</p>

          {/* Dashboard mockup */}
          <div className="mt-16 max-w-5xl mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-slate-800">
            <div className="bg-slate-900 px-4 py-3 flex items-center gap-2 border-b border-white/5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="text-slate-500 text-xs ml-2">findesk.kz/dashboard</span>
            </div>
            <div className="p-6 grid grid-cols-4 gap-3">
              {[
                { label: "Баланс", value: "4 250 000 ₸", color: "text-green-400" },
                { label: "Доходы (месяц)", value: "1 800 000 ₸", color: "text-blue-400" },
                { label: "Расходы (месяц)", value: "1 200 000 ₸", color: "text-red-400" },
                { label: "Чистая прибыль", value: "600 000 ₸", color: "text-emerald-400" },
              ].map((card) => (
                <div key={card.label} className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-slate-400 text-xs">{card.label}</p>
                  <p className={`font-bold text-sm mt-1 ${card.color}`}>{card.value}</p>
                </div>
              ))}
            </div>
            <div className="px-6 pb-6 space-y-2">
              <div className="bg-slate-700/30 rounded-lg h-32 flex items-center justify-center">
                <p className="text-slate-500 text-sm">График ДДС</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-700/30 rounded-lg h-16" />
                <div className="bg-slate-700/30 rounded-lg h-16" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Всё для управленческого учёта</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Один инструмент заменяет Excel, 1C и Telegram-переписку с бухгалтером
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="p-6 bg-slate-800/50 border border-slate-700/50 rounded-2xl hover:border-slate-600 transition-colors">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Как это работает</h2>
            <p className="text-slate-400 text-lg">Первый отчёт — через 5 минут</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={s.n} className="relative text-center">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-blue-500/50 to-transparent" />
                )}
                <div className="w-16 h-16 bg-[#1A56DB]/20 border border-[#1A56DB]/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-[#1A56DB] font-bold text-xl">{s.n}</span>
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Прозрачные тарифы</h2>
            <p className="text-slate-400 text-lg">Начните бесплатно, масштабируйтесь по мере роста</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.key}
                className={`p-6 rounded-2xl border ${
                  plan.highlight
                    ? "bg-[#1A56DB]/10 border-[#1A56DB]/50 ring-2 ring-[#1A56DB]/30"
                    : "bg-slate-800/50 border-slate-700/50"
                }`}
              >
                {plan.highlight && (
                  <div className="text-xs font-semibold text-[#1A56DB] uppercase tracking-wider mb-3">
                    Популярный
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  {plan.icon && <plan.icon className="w-5 h-5 text-[#1A56DB]" />}
                  <h3 className="text-white font-bold text-xl">{plan.name}</h3>
                </div>
                <p className="text-2xl font-bold text-white mb-6">{plan.price}</p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block text-center py-2.5 rounded-xl font-medium text-sm transition-colors ${
                    plan.highlight
                      ? "bg-[#1A56DB] hover:bg-[#1A56DB]/90 text-white"
                      : "bg-slate-700 hover:bg-slate-600 text-white"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-slate-950">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Частые вопросы</h2>
          </div>
          <div className="space-y-4">
            {faq.map((item) => (
              <details
                key={item.q}
                className="group bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden"
              >
                <summary className="flex items-center justify-between p-5 cursor-pointer text-white font-medium list-none">
                  {item.q}
                  <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform shrink-0 ml-3" />
                </summary>
                <p className="px-5 pb-5 text-slate-400 text-sm leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 bg-gradient-to-r from-[#1A56DB] to-blue-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Готовы взять финансы под контроль?</h2>
          <p className="text-blue-100 text-lg mb-8">
            14 дней бесплатно. Все функции Business открыты. Карта не нужна.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#1A56DB] rounded-xl font-bold text-lg hover:bg-blue-50 transition-colors"
          >
            Начать бесплатно <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="font-bold text-lg text-white mb-1">
                <span className="text-[#1A56DB]">Fin</span>desk
              </p>
              <p className="text-slate-500 text-sm">Финансовый учёт для бизнеса Казахстана</p>
              <p className="text-slate-600 text-xs mt-1">Алматы, Казахстан · support@findesk.kz</p>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a href="#" className="hover:text-white transition-colors">Политика конфиденциальности</a>
              <a href="#" className="hover:text-white transition-colors">Условия использования</a>
              <a href="/login" className="hover:text-white transition-colors">Войти</a>
            </div>
          </div>
          <p className="text-slate-700 text-xs mt-8 text-center">© 2025 Findesk. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
}
