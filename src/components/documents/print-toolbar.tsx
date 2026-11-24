"use client";

import { ArrowLeft, FileSpreadsheet, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonClasses } from "@/components/ui/button-styles";

/** Toolbar above a document (hidden when printing): print / save as PDF, Excel, back */
export function PrintToolbar({ excelHref, backHref }: { excelHref?: string; backHref: string }) {
  return (
    <div className="mx-auto mb-5 flex max-w-[210mm] flex-wrap items-center justify-between gap-3 px-4 print:hidden">
      <a href={backHref} className={buttonClasses("secondary", "md")}>
        <ArrowLeft /> กลับ
      </a>
      <div className="flex flex-wrap items-center gap-2">
        <span className="hidden text-xs text-zinc-500 sm:inline">เลือกปลายทาง “บันทึกเป็น PDF” ในหน้าต่างพิมพ์</span>
        {excelHref ? (
          <a href={excelHref} className={buttonClasses("secondary", "md")}>
            <FileSpreadsheet /> Excel
          </a>
        ) : null}
        <Button onClick={() => window.print()}>
          <Printer /> พิมพ์ / บันทึก PDF
        </Button>
      </div>
    </div>
  );
}
