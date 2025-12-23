"use client";
import { ModelResponseAPI } from "@/api/modelresponse.api";

import { ModelResponse } from "@/types";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "./ui/alert-dialog";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import axios from "axios";

const Responses = [
  {
    modelName: "gemini pro 2.o",
    responseText:
      "akjnfjiosndfviopasdfjsakd g[gjka[skjasdiopf jaosdifjpasodijnaif asdo vjsodkmsao pdijmn[sdi0 mcfs",
  },
  {
    modelName: "gemini pro 2.o",
    responseText:
      "akjnfjiosndfviopasdfjsakd g[gjka[skjasdiopf jaosdifjpasodijnaif asdo vjsodkmsao pdijmn[sdi0 mcfs",
  },
  {
    modelName: "gemini pro 2.o",
    responseText:
      "akjnfjiosndfviopasdfjsakd g[gjka[skjasdiopf jaosdifjpasodijnaif asdo vjsodkmsao pdijmn[sdi0 mcfs",
  },
];

export function ModelResponsesTable() {
  const [modelRes, setModelRes] = useState<ModelResponse[]>([]);
  const [selectedResponse, setSelectedResponse] = useState<ModelResponse | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    ModelResponseAPI.getModelResponses().then((res) => {
      setModelRes(res.data);
    });
  }, []);

  const handleCardClick = (response: ModelResponse) => {
    setSelectedResponse(response);
    setIsDialogOpen(true);
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pl-4 pt-5 ">
        {modelRes.map((response) =>
          response.responseText != null ? (
            <Card 
              key={response._id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleCardClick(response)}
            >
              <CardHeader>
                <CardTitle>{response.modelName} </CardTitle>
                <CardDescription className="font-medium">
                  {" "}
                  {new Date(response.createdAt).toLocaleString("en-IN")}
                </CardDescription>
                <CardDescription className="text-wrap line-clamp-2">
                  {response.responseText}
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null
        )}
      </div>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <button
            onClick={() => setIsDialogOpen(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <span className="text-2xl">&times;</span>
            <span className="sr-only">Close</span>
          </button>
          <AlertDialogHeader>
            <AlertDialogTitle>{selectedResponse?.modelName}</AlertDialogTitle>
            <AlertDialogDescription className="font-medium text-sm">
              {selectedResponse && new Date(selectedResponse.createdAt).toLocaleString("en-IN")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-4 prose prose-sm max-w-none dark:prose-invert overflow-x-auto">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {selectedResponse?.responseText || ""}
            </ReactMarkdown>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
