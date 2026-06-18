import React, { useState } from 'react';
import { GALLERY_MOCK_PHOTOS } from '../data';
import { Camera, X, Eye, ZoomIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function GallerySection() {
  const [selectedImageIdx, setSelectedImageIdx] = useState<number | null>(null);

  const handleOpenLightbox = (index: number) => {
    setSelectedImageIdx(index);
  };

  const handleCloseLightbox = () => {
    setSelectedImageIdx(null);
  };

  return (
    <section
      id="gallery"
      className="bg-slate-50 py-16 sm:py-24 border-b border-slate-100"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Module Header Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 sm:mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full inline-block">
            Real Environment · 真实店面实拍
          </span>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight sm:text-4xl">
            真实门店，真实交易，真实检测
          </h2>
          <p className="text-base sm:text-lg text-gray-500 leading-relaxed font-sans">
            实景拍摄，店面对外开放！实体门店给您双重保障，绝非网络空壳商户。实体陈列、高温拷机架一览，欢迎成都市民随时带卡来喝茶检测。
          </p>
        </div>

        {/* Photogrid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {GALLERY_MOCK_PHOTOS.map((photo, i) => (
            <div
              key={i}
              onClick={() => handleOpenLightbox(i)}
              className="group cursor-pointer relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-3 shadow-xs hover:shadow-md transition-all duration-300 hover:scale-101"
            >
              {/* Photo Image Frame */}
              <div className="relative overflow-hidden rounded-xl aspect-[4/3] bg-slate-100">
                <img
                  src={photo.mockUrl}
                  alt={photo.title}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-108"
                />
                
                {/* Black Overlay on Hover */}
                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="flex items-center gap-1 text-white bg-slate-900/80 px-3 py-1.5 rounded-xl text-xs font-bold shadow-md">
                    <ZoomIn className="h-4 w-4" /> 查看大图
                  </span>
                </div>

                <span className="absolute top-3 left-3 rounded-md bg-slate-900/75 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-1 tracking-wider">
                  {photo.tag}
                </span>
              </div>

              {/* Text Caption bottom */}
              <div className="pt-3 px-1.5 space-y-1">
                <h3 className="font-bold text-gray-900 text-sm tracking-tight">
                  {photo.title}
                </h3>
                <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed font-sans font-medium">
                  {photo.desc}
                </p>
              </div>

            </div>
          ))}
        </div>

        {/* Full-Screen Lightbox Dialog Overlay */}
        <AnimatePresence>
          {selectedImageIdx !== null && (
            <div id="gallery-lightbox" className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleCloseLightbox}
                className="absolute inset-0 bg-black/90 backdrop-blur-md"
              />

              {/* Lightbox Content Wrap */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative max-w-4xl w-full mx-auto p-2 bg-slate-950 rounded-2xl overflow-hidden shadow-2xl z-10 flex flex-col justify-between"
              >
                {/* Top header title details and close buttons */}
                <div className="flex justify-between items-center px-4 py-3 bg-slate-900/60 text-white rounded-t-xl">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 block font-mono">
                      {GALLERY_MOCK_PHOTOS[selectedImageIdx].tag}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-tight -mt-0.5">
                      {GALLERY_MOCK_PHOTOS[selectedImageIdx].title}
                    </h3>
                  </div>

                  <button
                    id="close-lightbox-btn"
                    onClick={handleCloseLightbox}
                    className="p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Big Image box */}
                <div className="relative aspect-[16/10] sm:aspect-[16/9] bg-slate-900">
                  <img
                    src={GALLERY_MOCK_PHOTOS[selectedImageIdx].mockUrl}
                    alt={GALLERY_MOCK_PHOTOS[selectedImageIdx].title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Bottom text metadata caption */}
                <p className="p-4 bg-slate-900 text-xs sm:text-sm text-slate-300 leading-relaxed text-center rounded-b-xl border-t border-slate-850 font-sans font-medium">
                  {GALLERY_MOCK_PHOTOS[selectedImageIdx].desc}
                </p>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
