'use client'
import AddTopicDialog from "@/components/AlertBox";
import { PromptTable } from "@/components/PromptTable";
import { Button } from "@/components/ui/button";

import React, { useState } from "react";

export default function page() {
     const [dialogOpen, setDialogOpen] = useState(false);

     const  handleSubmit =  (data: any)=>{
        console.log(data)
     }
  return (
    <div className="flex flex-col max-h-screen">


      <div className="flex justify-end h-10 w-full pb-4">
        <Button onClick={()=>setDialogOpen(true)}>add prompt</Button>
        <AddTopicDialog 
            open= {dialogOpen}
            onOpenChange={setDialogOpen}
            onSubmit={handleSubmit}
        />
      </div>

      <div className="w-300 pt-4">
        <PromptTable />
      </div>
    </div>
  );
}
