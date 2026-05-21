// src/hooks/useFormPersist.ts
import { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';

export const useFormPersist = (
  form: UseFormReturn<any>,
  storageKey: string,
  excludeFields: string[] = []
) => {
  const { watch, setValue } = form;
  const values = watch();

  // 1. Efek untuk mengambil data dari LocalStorage saat halaman pertama kali dibuka
  useEffect(() => {
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        
        // Memasukkan data yang tersimpan ke dalam form field satu per satu
        Object.keys(parsedData).forEach((key) => {
          if (!excludeFields.includes(key)) {
            setValue(key, parsedData[key]);
          }
        });
      } catch (error) {
        console.error("Gagal memuat draft data:", error);
      }
    }
  }, [storageKey, setValue, excludeFields]);

  // 2. Efek untuk menyimpan data ke LocalStorage setiap kali ada perubahan input (Debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      const dataToSave = { ...values };
      
      // Hapus field yang dikecualikan (seperti password atau file)
      excludeFields.forEach(field => delete dataToSave[field]);
      
      // Filter: Jangan simpan objek File/Blob ke LocalStorage karena akan menyebabkan error
      const cleanData = Object.fromEntries(
        Object.entries(dataToSave).filter(([_, value]) => {
          return !(value instanceof File) && !(value instanceof FileList);
        })
      );

      localStorage.setItem(storageKey, JSON.stringify(cleanData));
    }, 1000); // Menyimpan 1 detik setelah user berhenti mengetik

    return () => clearTimeout(timeout);
  }, [values, storageKey, excludeFields]);
};