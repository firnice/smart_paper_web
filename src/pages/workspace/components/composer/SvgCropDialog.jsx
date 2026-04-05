import { Check, Wand2, X } from "lucide-react";
import useEscapeKey from "../../../../hooks/useEscapeKey.js";
import InteractiveCropBox from "./InteractiveCropBox.jsx";

export default function SvgCropDialog({ question, imageSrc, onClose, onConfirm, onChangeCrop }) {
  useEscapeKey(Boolean(question && imageSrc), onClose);

  if (!question || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm md:p-12">
      <div className="flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
            <Wand2 className="h-5 w-5 text-purple-600" />
            框选需要生成 SVG 的图形区域
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative flex items-center justify-center overflow-auto bg-gray-900 p-4 select-none" style={{ height: "480px" }}>
          <div className="relative inline-block max-h-full">
            <img src={imageSrc} alt="Paper" className="block max-h-[420px] max-w-full object-contain opacity-80" />
            <InteractiveCropBox
              value={question.svgCrop}
              onChange={(nextCrop) => onChangeCrop(question.id, nextCrop)}
              color="purple"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-5 py-2 font-medium text-gray-700 hover:bg-gray-200"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2 font-medium text-white shadow-sm hover:bg-purple-700"
          >
            <Check className="h-4 w-4" />
            确认截取并生成
          </button>
        </div>
      </div>
    </div>
  );
}
