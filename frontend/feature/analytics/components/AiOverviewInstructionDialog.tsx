
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import React from 'react'

function AiOverviewInstructionDialog({ showInstallInstructions, setShowInstallInstructions }: { showInstallInstructions: boolean, setShowInstallInstructions: (val: boolean) => void }) {
  return (
    <div>
      <AlertDialog
        open={showInstallInstructions}
        onOpenChange={setShowInstallInstructions}
      >
        <AlertDialogContent
          className="
                                max-w-none sm:max-w-none
                                w-[80vw] h-[85vh]
                                p-0 bg-white rounded-2xl
                                border border-border shadow-2xl
                                overflow-hidden flex flex-col
                              "
        >
          <AlertDialogTitle className="sr-only">
            AI Overview Tracking Setup
          </AlertDialogTitle>
          <AlertDialogDescription className="sr-only">
            Instructions for tracking AI Overview clicks
          </AlertDialogDescription>

          {/* Header */}
          <div className="px-10 py-5 border-b border-border flex items-center justify-between bg-white shrink-0">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold text-slate-900">
                AI Overview Tracking Setup
              </h2>
              <p className="text-xs text-slate-500">
                Add this simple code to your client's website to track AI Overview clicks.
              </p>
            </div>
            <button
              onClick={() => setShowInstallInstructions(false)}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-white p-10">
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Step 1 */}
              <div className="group relative rounded-lg border border-slate-200 bg-slate-50 p-5">
                <div className="absolute -left-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 border-4 border-white text-white font-bold shadow-sm">
                  1
                </div>
                <h3 className="mb-2 font-bold text-slate-900 ml-3">Find GA4 Tracking Code</h3>
                <p className="text-sm text-slate-600 ml-3">
                  Check the <code className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-xs font-semibold">&lt;head&gt;</code> section of your client's website for the Google Analytics script.
                </p>
              </div>

              {/* Step 2 */}
              <div className="group relative rounded-lg border border-slate-200 bg-slate-50 p-5">
                <div className="absolute -left-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 border-4 border-white text-white font-bold shadow-sm">
                  2
                </div>
                <h3 className="mb-2 font-bold text-slate-900 ml-3">Insert Tracking Script</h3>
                <p className="text-sm text-slate-600 ml-3 mb-4">
                  Paste the snippet below immediately after the line <code className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-xs font-semibold">gtag('config', 'G-XXXX');</code>.
                </p>

                <div className="relative rounded-md bg-slate-900 mx-3">
                  <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-slate-300 font-mono">
                    {`// AI Overview Detection (Performance API)
          (function(){try{var n=performance.getEntriesByType('navigation')[0];
          var u=n?n.name:document.URL;
          if(u.includes(':~:text=')){
            var r=0,s=function(){
              var p={page_location:u,page_path:new URL(u).pathname+new URL(u).hash};
              if(typeof gtag!=='undefined'){gtag('event','ai_overview_click',p);}
              else if(window.dataLayer){dataLayer.push({'event':'ai_overview_click',...p});}
              else if(r++<50){setTimeout(s,200);}
            };s();
          }}catch(e){}})();`}
                  </pre>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute right-2 top-2 h-7 px-2 text-xs hover:bg-slate-700 hover:text-white bg-slate-800 text-slate-400 border border-slate-700"
                    onClick={() => {
                      navigator.clipboard.writeText(`(function(){try{var n=performance.getEntriesByType('navigation')[0];
          var u=n?n.name:document.URL;
          if(u.includes(':~:text=')){
            var r=0,s=function(){
              var p={page_location:u,page_path:new URL(u).pathname+new URL(u).hash};
              if(typeof gtag!=='undefined'){gtag('event','ai_overview_click',p);}
              else if(window.dataLayer){dataLayer.push({'event':'ai_overview_click',...p});}
              else if(r++<50){setTimeout(s,200);}
            };s();
          }}catch(e){}})();`);
                      toast.success("Snippet copied to clipboard");
                    }}
                  >
                    Copy Snippet
                  </Button>
                </div>
              </div>

              {/* Complete Example */}
              <div className="space-y-3 pt-2">
                <h3 className="font-bold text-base text-slate-700 ml-1">
                  Complete Example Reference:
                </h3>
                <div className="relative rounded-md bg-slate-50 border border-slate-200">
                  <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-slate-600 font-mono">
                    {`<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
          <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXXXXXXXXX');
            
            // AI Overview Detection
            (function(){try{var n=performance.getEntriesByType('navigation')[0];
            var u=n?n.name:document.URL;
            if(u.includes(':~:text=')){
              var r=0,s=function(){
                var p={page_location:u,page_path:new URL(u).pathname+new URL(u).hash};
                if(typeof gtag!=='undefined'){gtag('event','ai_overview_click',p);}
                else if(window.dataLayer){dataLayer.push({'event':'ai_overview_click',...p});}
                else if(r++<50){setTimeout(s,200);}
              };s();
            }}catch(e){}})();
          </script>`}
                  </pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute right-2 top-2 h-7 px-2 text-xs bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    onClick={() => {
                      navigator.clipboard.writeText(`<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
          <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXXXXXXXXX');
            
            // AI Overview Detection
            (function(){try{var n=performance.getEntriesByType('navigation')[0];
            var u=n?n.name:document.URL;
            if(u.includes(':~:text=')){
              var r=0,s=function(){
                var p={page_location:u,page_path:new URL(u).pathname+new URL(u).hash};
                if(typeof gtag!=='undefined'){gtag('event','ai_overview_click',p);}
                else if(window.dataLayer){dataLayer.push({'event':'ai_overview_click',...p});}
                else if(r++<50){setTimeout(s,200);}
              };s();
            }}catch(e){}})();
          </script>`);
                      toast.success("Complete example copied");
                    }}
                  >
                    Copy Full Example
                  </Button>
                </div>
              </div>

              {/* <div className="mt-8 rounded-lg border border-blue-100 bg-blue-50/50 p-4">
                <h4 className="mb-2 font-semibold text-blue-900 flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Validation</span>
                  How to verify?
                </h4>
                <ul className="list-disc list-inside text-sm text-blue-800 space-y-1 ml-1">
                  <li>Open the browser console (F12)</li>
                  <li>Go to the <strong>Network</strong> tab</li>
                  <li>Filter for "collect" requests</li>
                  <li>Click an AI Overview link and ensure an event is fired</li>
                </ul>
              </div> */}

            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}

export default AiOverviewInstructionDialog