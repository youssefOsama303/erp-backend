import { motion } from 'framer-motion'
import { 
  Wallet, 
  ShoppingCart, 
  Boxes, 
  Users, 
  FileText, 
  Settings,
  ArrowLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const modules = [
  {
    icon: Wallet,
    title: 'المحاسبة والمالية',
    subtitle: 'Accounting & Finance',
    description: 'نظام محاسبي متكامل يغطي جميع احتياجاتك المالية',
    features: [
      'دليل حسابات متكامل (Chart of Accounts)',
      'قيود يومية معتمدة (Journal Entries)',
      'ميزان المراجعة والقوائم المالية',
      'تقارير الأرباح والخسائر لحظية',
    ],
    color: 'from-emerald-400 to-teal-600',
    bgColor: 'bg-emerald-500/10',
  },
  {
    icon: ShoppingCart,
    title: 'المبيعات وCRM',
    subtitle: 'Sales & CRM',
    description: 'إدارة المبيعات وعلاقات العملاء بكفاءة عالية',
    features: [
      'نظام فواتير سريع وسهل',
      'لوحة Kanban لمتابعة العملاء',
      'تتبع الفرص والعروض',
      'تقارير أداء المبيعات',
    ],
    color: 'from-blue-400 to-indigo-600',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: Boxes,
    title: 'إدارة المخازن',
    subtitle: 'Inventory Management',
    description: 'تحكم كامل في المخزون عبر الفروع',
    features: [
      'تتبع الأصناف بلمح البصر',
      'خريطة حرارية للمخزون',
      'تنبيهات النواقص التلقائية',
      'جرد دوري متكامل',
    ],
    color: 'from-orange-400 to-red-600',
    bgColor: 'bg-orange-500/10',
  },
  {
    icon: Users,
    title: 'الموارد البشرية',
    subtitle: 'Human Resources',
    description: 'إدارة شاملة لموظفيك ورواتبهم',
    features: [
      'سجلات الموظفين الكاملة',
      'نظام الحضور والانصراف',
      'حساب الرواتب والبدلات',
      'إدارة الإجازات والأذونات',
    ],
    color: 'from-purple-400 to-pink-600',
    bgColor: 'bg-purple-500/10',
  },
  {
    icon: FileText,
    title: 'التقارير والتحليلات',
    subtitle: 'Reports & Analytics',
    description: 'رؤى عميقة لأداء عملك',
    features: [
      'تقارير قابلة للتصدير (PDF/CSV)',
      'رسوم بيانية تفاعلية',
      'لوحة KPIs مخصصة',
      'جدولة التقارير التلقائية',
    ],
    color: 'from-cyan-400 to-blue-600',
    bgColor: 'bg-cyan-500/10',
  },
  {
    icon: Settings,
    title: 'الإعدادات والأمان',
    subtitle: 'Settings & Security',
    description: 'تحكم كامل في النظام وبياناتك',
    features: [
      'نظام صلاحيات متعدد المستويات',
      'White-label لعلامتك التجارية',
      'نسخ احتياطي يومي',
      'سجل العمليات الكامل',
    ],
    color: 'from-gray-400 to-slate-600',
    bgColor: 'bg-gray-500/10',
  },
]

export function Modules() {
  return (
    <section id="modules" className="relative py-24 lg:py-32 bg-[#0a0f1c]">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium mb-4">
            وحدات النظام
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            كل الوحدات <span className="text-blue-400">في مكان واحد</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            نظام متكامل يغطي جميع احتياجات عملك دون الحاجة لبرامج إضافية
          </p>
        </motion.div>

        {/* Modules Grid */}
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          {modules.map((module, index) => (
            <motion.div
              key={module.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative"
            >
              <div className="relative p-6 lg:p-8 rounded-2xl bg-[#0f1629] border border-gray-800 hover:border-gray-700 transition-all duration-300 h-full">
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-6">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center flex-shrink-0`}>
                      <module.icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">
                        {module.title}
                      </h3>
                      <p className="text-gray-500 text-sm">{module.subtitle}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-400 mb-6">{module.description}</p>

                  {/* Features List */}
                  <ul className="space-y-3 mb-6 flex-grow">
                    {module.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-gray-300">
                        <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${module.color}`} />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Button
                    variant="ghost"
                    className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 justify-start p-0 h-auto"
                  >
                    اكتشف المزيد
                    <ArrowLeft className="w-4 h-4 mr-2" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
