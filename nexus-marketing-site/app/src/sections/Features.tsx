import { motion } from 'framer-motion'
import { Zap, Shield, BarChart3, Users, Package, Calculator } from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'سرعة فائقة',
    description: 'واجهة Single Page Application تحمل فورياً. لا مزيد من انتظار إعادة تحميل الصفحات.',
    color: 'from-yellow-400 to-orange-500',
  },
  {
    icon: Shield,
    title: 'أمان كامل',
    description: 'نظام صلاحيات متكامل يضمن رؤية كل موظف لبياناته فقط. حماية تامة من الحذف العرضي.',
    color: 'from-green-400 to-emerald-600',
  },
  {
    icon: BarChart3,
    title: 'رؤية لحظية',
    description: 'تحويل البيانات الخام إلى رسوم بيانية تفاعلية. قرارات مبنية على أرقام حقيقية.',
    color: 'from-cyan-400 to-blue-500',
  },
  {
    icon: Users,
    title: 'إدارة الموظفين',
    description: 'نظام HR متكامل للحضور والرواتب والإجازات. كل شيء في مكان واحد.',
    color: 'from-purple-400 to-pink-500',
  },
  {
    icon: Package,
    title: 'تحكم بالمخزون',
    description: 'تتبع الأصناف عبر فروع متعددة. خريطة حرارية تكشف الناقص بلمح البصر.',
    color: 'from-rose-400 to-red-500',
  },
  {
    icon: Calculator,
    title: 'محاسبة متكاملة',
    description: 'دليل حسابات كامل مع قيود يومية تنعكس فوراً على الأرصدة. تقارير مالية دقيقة.',
    color: 'from-indigo-400 to-violet-500',
  },
]

export function Features() {
  return (
    <section id="features" className="relative py-24 lg:py-32 bg-[#0a0f1c]">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px]" />
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
          <span className="inline-block px-4 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 text-sm font-medium mb-4">
            لماذا Nexus ERP؟
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            كل ما تحتاجه لإدارة <span className="text-cyan-400">شركتك</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            بدلاً من شراء عدة برامج منفصلة، احصل على نظام موحد يغطي جميع جوانب عملك
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative"
            >
              <div className="relative p-6 lg:p-8 rounded-2xl bg-[#0f1629] border border-gray-800 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 h-full">
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover Glow */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/5 group-hover:to-blue-500/5 transition-all duration-300" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
