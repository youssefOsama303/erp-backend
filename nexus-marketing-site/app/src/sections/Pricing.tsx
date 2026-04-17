import { motion } from 'framer-motion'
import { Check, Sparkles, Building2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

const plans = [
  {
    name: 'الباقة المجانية',
    nameEn: 'Free Tier',
    description: 'للشركات الصغيرة والتجربة',
    price: '0',
    period: 'شهرياً',
    icon: User,
    features: [
      'مستخدم واحد (مدير)',
      'حد 50 فاتورة/قيد شهرياً',
      'مخزن واحد',
      'لوحة تحكم أساسية',
      'دعم عبر البريد',
    ],
    excluded: [
      'تصدير التقارير',
      'النسخ الاحتياطي',
      'White-label',
    ],
    cta: 'ابدأ مجاناً',
    popular: false,
    color: 'from-gray-400 to-gray-600',
  },
  {
    name: 'باقة المحترفين',
    nameEn: 'Pro Tier',
    description: 'للشركات المتنامية',
    price: '299',
    period: 'شهرياً',
    icon: Sparkles,
    features: [
      '5 مستخدمين بصلاحيات',
      'فواتير وقيود غير محدودة',
      'مخازن متعددة',
      'تقارير متقدمة + تصدير',
      'النسخ الاحتياطي اليدوي',
      'دعم فني متميز',
    ],
    excluded: [
      'White-label',
      'دعم 24/7',
    ],
    cta: 'اشترك الآن',
    popular: true,
    color: 'from-cyan-400 to-blue-600',
  },
  {
    name: 'باقة الأعمال',
    nameEn: 'Business',
    description: 'للشركات الكبيرة',
    price: '999',
    period: 'شهرياً',
    icon: Building2,
    features: [
      'مستخدمين وفروع غير محدودة',
      'كل شيء في Pro',
      'White-label كامل',
      'نسخ احتياطي تلقائي',
      'دعم فني 24/7',
      'مدير حساب مخصص',
      'تخصيص كامل',
    ],
    excluded: [],
    cta: 'تواصل معنا',
    popular: false,
    color: 'from-purple-400 to-pink-600',
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="relative py-24 lg:py-32 bg-[#0a0f1c]">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px]" />
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
          <span className="inline-block px-4 py-1.5 rounded-full bg-purple-500/10 text-purple-400 text-sm font-medium mb-4">
            الأسعار
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            خطط <span className="text-cyan-400">شفافة</span> تناسب كل عمل
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            ابدأ مجاناً وقم بالترقية عندما ينمو عملك. لا رسوم خفية، لا مفاجآت.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative rounded-2xl ${
                plan.popular
                  ? 'bg-gradient-to-b from-cyan-500/20 to-blue-600/20 border-2 border-cyan-500/50'
                  : 'bg-[#0f1629] border border-gray-800'
              } p-6 lg:p-8`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium">
                    الأكثر شيوعاً
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mx-auto mb-4`}>
                  <plan.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-gray-500 text-sm mb-1">{plan.nameEn}</p>
                <p className="text-gray-400 text-sm">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="text-center mb-8">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl lg:text-5xl font-bold text-white">{plan.price}</span>
                  <span className="text-gray-400">ر.س</span>
                </div>
                <span className="text-gray-500 text-sm">{plan.period}</span>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-green-500" />
                    </div>
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </li>
                ))}
                {plan.excluded.map((feature, i) => (
                  <li key={`ex-${i}`} className="flex items-center gap-3 opacity-50">
                    <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-500 text-xs">×</span>
                    </div>
                    <span className="text-gray-500 text-sm line-through">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                className={`w-full py-6 text-lg font-semibold rounded-xl ${
                  plan.popular
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white'
                    : 'bg-gray-800 hover:bg-gray-700 text-white'
                }`}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Enterprise Note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-400">
            هل تحتاج خطة مخصصة؟{' '}
            <a href="#contact" className="text-cyan-400 hover:text-cyan-300 underline">
              تواصل مع فريق المبيعات
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
