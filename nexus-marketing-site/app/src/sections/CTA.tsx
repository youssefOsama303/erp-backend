import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MessageCircle, Phone } from 'lucide-react'
import { SITE_CONFIG } from '@/config'

export function CTA() {
  return (
    <section id="contact" className="relative py-24 lg:py-32 bg-[#0a0f1c]">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Badge */}
          <span className="inline-block px-4 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 text-sm font-medium mb-6">
            ابدأ رحلتك الآن
          </span>

          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            توقف عن تخمين أرباحك..
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mt-2">
              ابدأ بإدارتها بذكاء
            </span>
          </h2>

          {/* Description */}
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10">
            انضم لأكثر من 500 شركة تستخدم Nexus ERP لإدارة أعمالها بكفاءة. 
            ابدأ مجاناً واكتشف الفرق بنفسك.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              onClick={() => window.location.href = SITE_CONFIG.demoUrl}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg shadow-cyan-500/25"
            >
              جرب Nexus مجاناً
              <ArrowLeft className="w-5 h-5 mr-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => window.open(SITE_CONFIG.whatsappUrl, '_blank')}
              className="border-gray-700 text-white hover:bg-white/5 px-8 py-6 text-lg rounded-xl"
            >
              <Phone className="w-5 h-5 ml-2" />
              احجز عرض توضيحي
            </Button>
          </div>

          {/* Contact Options */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <a
              href={SITE_CONFIG.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-6 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span>تواصل عبر واتساب</span>
            </a>
            <a
              href={SITE_CONFIG.email}
              className="flex items-center gap-3 px-6 py-3 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 transition-colors"
            >
              <span>{SITE_CONFIG.email.replace('mailto:', '')}</span>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
