import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    name: 'أحمد المحمد',
    role: 'مدير عام',
    company: 'شركة التقنية المتقدمة',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    content: 'Nexus ERP غيّر طريقة إدارتنا تماماً. ما كنا نستغرقه أياماً في Excel أصبح الآن دقائق. النظام سريع جداً والدعم الفني ممتاز.',
    rating: 5,
  },
  {
    name: 'سارة العلي',
    role: 'محاسبة قانونية',
    company: 'مؤسسة النهضة',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    content: 'أفضل نظام ERP جربته للشركات الصغيرة. الواجهة بديهية والتقارير المالية دقيقة جداً. وفّر لي ساعات من العمل اليومي.',
    rating: 5,
  },
  {
    name: 'محمد الكعبي',
    role: 'صاحب متجر',
    company: 'متجر الإلكترونيات',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    content: 'نظام المخازن رائع! الخريطة الحرارية تساعدني أعرف أي المنتجات تحتاج تعبئة فوراً. أنصح به بشدة لأصحاب المتاجر.',
    rating: 5,
  },
]

export function Testimonials() {
  return (
    <section className="relative py-24 lg:py-32 bg-[#0a0f1c]">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[100px]" />
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
          <span className="inline-block px-4 py-1.5 rounded-full bg-green-500/10 text-green-400 text-sm font-medium mb-4">
            آراء العملاء
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            ثقة <span className="text-cyan-400">مئات الشركات</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            انضم لشبكة من الشركات الناجحة التي تستخدم Nexus ERP لإدارة أعمالها
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              <div className="p-6 lg:p-8 rounded-2xl bg-[#0f1629] border border-gray-800 h-full">
                {/* Quote Icon */}
                <Quote className="w-10 h-10 text-cyan-500/20 mb-4" />

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-gray-300 mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-cyan-500/30"
                  />
                  <div>
                    <h4 className="text-white font-semibold">{testimonial.name}</h4>
                    <p className="text-gray-500 text-sm">
                      {testimonial.role} · {testimonial.company}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {[
            { value: '500+', label: 'شركة ناشئة' },
            { value: '50K+', label: 'فاتورة شهرياً' },
            { value: '99.9%', label: 'وقت التشغيل' },
            { value: '4.9', label: 'تقييم العملاء' },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-cyan-400 mb-2">
                {stat.value}
              </div>
              <div className="text-gray-500 text-sm">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
