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
import { Box } from "lucide-react";

export function ModelResponsesTable() {
  const [modelRes, setModelRes] = useState<ModelResponse[]>([]);
  const [selectedResponse, setSelectedResponse] =
    useState<ModelResponse | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    ModelResponseAPI.getModelResponses()
      .then((res) => {
        console.log("Model Responses:", res.data);
        setModelRes(res.data);
      })
      .catch((error) => {
        console.error("Error fetching model responses:", error);
      });
  }, []);

  const handleCardClick = (response: ModelResponse) => {
    setSelectedResponse(response);
    console.log("Selected Response:", response);
    console.log("Identified Brands:", response.identifiedBrands);
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
        <AlertDialogContent className="min-w-4xl h-[80vh] rounded p-0 gap-0 flex flex-col">
          <AlertDialogHeader className="sr-only">
            <AlertDialogTitle>{selectedResponse?.modelName}</AlertDialogTitle>
            <AlertDialogDescription>
              Model response details and identified brands
            </AlertDialogDescription>
          </AlertDialogHeader>

          <button
            onClick={() => setIsDialogOpen(false)}
            className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <span className="text-2xl">&times;</span>
            <span className="sr-only">Close</span>
          </button>

          {/* Header */}
          <div className="px-6 py-4 border-b bg-gray-50 flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                Succeeded
              </span>
              <span className="text-sm font-medium text-gray-700">
                {selectedResponse?.modelName}
              </span>
              <span className="text-xs text-gray-500">
                {selectedResponse &&
                  new Date(selectedResponse.createdAt).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="flex flex-1 overflow-hidden min-h-0">
            {/* Left Side - Response */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Prompt
                </h3>
                {selectedResponse?.promptRunId && typeof selectedResponse.promptRunId === 'object' && selectedResponse.promptRunId.promptId ? (
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-gray-700 leading-relaxed">
                      {selectedResponse.promptRunId.promptId.promptText}
                    </p>
                    {selectedResponse.promptRunId.promptId.topic && (
                      <div className="mt-2">
                        <span className="inline-block px-2 py-1 text-xs bg-blue-100 rounded-2xl ">
                          {selectedResponse.promptRunId.promptId.topic}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-3">
                    <span>No prompt data</span>
                  </div>
                )}
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedResponse?.responseText ||
                    "No response text available"}
                </ReactMarkdown>
              </div>
            </div>

            {/* Right Sidebar - Brands & Prompt */}
            <div className="w-64 border-l bg-gray-50 overflow-y-auto p-4">
              {/* Prompt Section */}
              

              {/* Brands Section */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Brands 
                </h3>
                {selectedResponse?.identifiedBrands &&
                selectedResponse.identifiedBrands.length > 0 ? (
                  <div className="space-y-2">
                    {selectedResponse.identifiedBrands.map((brand) => (
                      <div
                        key={brand._id}
                        className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
                      >
                    
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {brand.brand_name}
                          </p>
                          {brand.mentions !== undefined && (
                            <p className="text-xs text-gray-500">
                              {brand.mentions} mentions
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-3">
                    <span>No brands identified</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
