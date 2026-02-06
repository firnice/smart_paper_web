import { createContext, useContext, useState, useEffect } from "react";
import { cropImage, loadImage } from "../utils/imageUtils";

const PaperContext = createContext(null);

export function PaperProvider({ children }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  
  // OCR Data
  const [ocrItems, setOcrItems] = useState([]);
  const [ocrStatus, setOcrStatus] = useState("idle"); // idle, loading, success, error
  const [ocrError, setOcrError] = useState("");

  // Crops cache
  const [crops, setCrops] = useState({});

  // Variants Data
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [variants, setVariants] = useState([]); // Array of generated variant strings
  const [variantStatus, setVariantStatus] = useState("idle");
  const [variantError, setVariantError] = useState("");

  // Export Data
  const [exportStatus, setExportStatus] = useState("idle");
  const [exportData, setExportData] = useState(null);
  const [exportError, setExportError] = useState("");

  // Handle File Preview
  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Handle Cropping when items or previewUrl changes
  useEffect(() => {
    if (!previewUrl || ocrItems.length === 0) {
      setCrops({});
      return;
    }
    let cancelled = false;
    const run = async () => {
      const image = await loadImage(previewUrl);
      const next = {};
      for (const item of ocrItems) {
        if (item.has_image && item.image_box) {
          const cropped = cropImage(image, item.image_box);
          if (cropped) {
            next[item.id] = cropped;
          }
        }
      }
      if (!cancelled) {
        setCrops(next);
      }
    };
    run().catch(() => {
      if (!cancelled) {
        setCrops({});
      }
    });
    return () => {
      cancelled = true;
    };
  }, [previewUrl, ocrItems]);

  const resetSession = () => {
    setOcrItems([]);
    setOcrStatus("idle");
    setOcrError("");
    setVariants([]);
    setVariantStatus("idle");
    setSelectedQuestionId(null);
    setExportStatus("idle");
    setExportData(null);
    setCrops({});
  };

  const value = {
    file,
    setFile,
    previewUrl,
    ocrItems,
    setOcrItems,
    ocrStatus,
    setOcrStatus,
    ocrError,
    setOcrError,
    crops,
    selectedQuestionId,
    setSelectedQuestionId,
    variants,
    setVariants,
    variantStatus,
    setVariantStatus,
    variantError,
    setVariantError,
    exportStatus,
    setExportStatus,
    exportData,
    setExportData,
    exportError,
    setExportError,
    resetSession
  };

  return (
    <PaperContext.Provider value={value}>
      {children}
    </PaperContext.Provider>
  );
}

export function usePaper() {
  const context = useContext(PaperContext);
  if (!context) {
    throw new Error("usePaper must be used within a PaperProvider");
  }
  return context;
}
