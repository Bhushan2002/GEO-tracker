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

export function ModelResponsesTable() {
  const [modelRes, setModelRes] = useState<ModelResponse[]>([]);
  const [selectedResponse, setSelectedResponse] =
    useState<ModelResponse | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const BRAND_COLORS = [
    "#3b82f6",
    "#6366f1",
    "#f97316",
    "#10b981",
    "#06b6d4",
    "#8b5cf6",
    "#ec4899",
    "#f59e0b",
    "#ef4444",
    "#14b8a6",
  ];

  const highlightBrandsInText = (text: string, brands: any[]) => {
    console.log("highlightBrandsInText CALLED ");
    console.log("Text length:", text.length);
    console.log("Brands count:", brands?.length || 0);
    
    if (!brands || brands.length === 0) return text;

    // Filter brands to only include those actually mentioned in the text
    const mentionedBrands = brands.filter(brand => {
      const brandName = brand.brand_name;
      const escapedBrandName = brandName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b(${escapedBrandName})\\b`, "i");
      return regex.test(text);
    });

    console.log("Mentioned brands count:", mentionedBrands.length);

    let highlightedText = text;

    mentionedBrands.forEach((brand, index) => {
      const color = BRAND_COLORS[index % BRAND_COLORS.length];
      const brandName = brand.brand_name;

      console.log(`\n Brand ${index + 1}: ${brandName} `);
      console.log("Brand object:", brand);
      console.log("Has sentiment_text:", !!brand.sentiment_text);
      console.log("sentiment_text value:", brand.sentiment_text);

      // Escape special regex characters in brand name
      const escapedBrandName = brandName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Create a regex to find all occurrences (case-insensitive, word boundaries)
      const regex = new RegExp(`\\b(${escapedBrandName})\\b`, "gi");

      // Replace with highlighted span
      highlightedText = highlightedText.replace(
        regex,
        `<mark style="background-color: ${color}33; color: ${color}; font-weight: 600; padding: 2px 4px; border-radius: 3px;">$1</mark>`
      );

      // Also highlight sentiment_text if it exists
      if (brand.sentiment_text && brand.sentiment_text.trim()) {
        const sentimentText = brand.sentiment_text.trim();
        console.log("✓ Sentiment text to highlight:", sentimentText);
        const escapedSentimentText = sentimentText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Use a more flexible regex for sentiment text (may contain multiple words)
        const sentimentRegex = new RegExp(`(${escapedSentimentText})`, "gi");
        
        // Check if it matches
        const matches = text.match(sentimentRegex);
        console.log("Sentiment text matches found:", matches ? matches.length : 0);
        if (matches) {
          console.log("Matched texts:", matches);
        }
        
        // Replace with highlighted span with a slightly different style (border instead of just background)
        const beforeReplace = highlightedText;
        highlightedText = highlightedText.replace(
          sentimentRegex,
          `<mark style="background-color: ${color}20; color: ${color}; border: 1px solid ${color}; padding: 2px 4px; border-radius: 3px; font-style: italic;">$1</mark>`
        );
        console.log("Text changed after sentiment replace:", beforeReplace !== highlightedText);
      } else {
        console.log("✗ No sentiment_text or empty");
      }
    });

    console.log("=== highlightBrandsInText COMPLETE ===\n");
    return highlightedText;
  };

  const getHighlightedResponse = () => {
    if (
      !selectedResponse?.responseText ||
      !selectedResponse?.identifiedBrands
    ) {
      return selectedResponse?.responseText || "No response text available";
    }

    let text = selectedResponse.responseText;
    selectedResponse.identifiedBrands.forEach((brand, index) => {
      const color = BRAND_COLORS[index % BRAND_COLORS.length];
      const regex = new RegExp(`\\b(${brand.brand_name})\\b`, "gi");
      text = text.replace(regex, `**<span style="color: ${color}">$1</span>**`);
    });

    return text;
  };

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
          <div className="px-6 py-4 border-b bg-gray-50 shrink-0">
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
                {selectedResponse?.promptRunId &&
                typeof selectedResponse.promptRunId === "object" &&
                selectedResponse.promptRunId.promptId ? (
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
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: highlightBrandsInText(
                      selectedResponse?.responseText || "No response text available",
                      selectedResponse?.identifiedBrands || []
                    )
                  }} 
                />
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
                selectedResponse.identifiedBrands.filter(brand => {
                  // Only show brands that are actually mentioned in the response text
                  const responseText = selectedResponse.responseText || "";
                  const brandName = brand.brand_name;
                  const regex = new RegExp(`\\b${brandName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                  return regex.test(responseText);
                }).length > 0 ? (
                  <div className="space-y-2">
                    {selectedResponse.identifiedBrands
                      .filter(brand => {
                        // Only show brands that are actually mentioned in the response text
                        const responseText = selectedResponse.responseText || "";
                        const brandName = brand.brand_name;
                        const regex = new RegExp(`\\b${brandName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                        return regex.test(responseText);
                      })
                      .map((brand, index) => (
                      <div
                        key={brand._id}
                        className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
                        style={{ borderLeftColor: BRAND_COLORS[index % BRAND_COLORS.length], borderLeftWidth: '3px' }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {brand.brand_name}
                          </p>
                          <div className="">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    (brand.sentiment_score ?? 0) >= 7
                                      ? "bg-green-500"
                                      : (brand.sentiment_score ?? 0) >= 4
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                  }`}
                                  style={{
                                    width: `${
                                      ((brand.sentiment_score ?? 0) / 100) * 100
                                    }%`,
                                  }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-gray-900">
                                {brand.sentiment_score}/100
                              </span>
                            </div>
                            {brand.sentiment && (
                              <p className="text-xs text-gray-500 mt-1">
                                {brand.sentiment}
                              </p>
                            )}
                          </div>
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

              {/* Domain Citations Section */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Domain Citations
                </h3>
                {selectedResponse?.identifiedBrands &&
                selectedResponse.identifiedBrands.some(
                  (brand) =>
                    brand.associated_domain &&
                    brand.associated_domain.length > 0
                ) ? (
                  <div className="space-y-2">
                    {selectedResponse.identifiedBrands.map((brand) =>
                      brand.associated_domain?.map((domain, idx) => (
                        <div
                          key={`domain-${brand._id}-${idx}`}
                          className="p-3 bg-white rounded-lg border border-gray-200"
                        >
                          <p className="text-xs font-medium text-gray-900 truncate mb-1">
                            {domain.domain_citation}
                          </p>
                          {domain.domain_citation_type && (
                            <span className="inline-block px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded">
                              {domain.domain_citation_type}
                            </span>
                          )}
                          {domain.associated_url &&
                            domain.associated_url.length > 0 && (
                              <p className="text-xs text-gray-500 mt-1">
                                {domain.associated_url.length} URL
                                {domain.associated_url.length > 1 ? "s" : ""}
                              </p>
                            )}
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-3">
                    <span>No domain citations</span>
                  </div>
                )}
              </div>

              {/* Associated Links Section */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Associated Links
                </h3>
                {selectedResponse?.identifiedBrands &&
                selectedResponse.identifiedBrands.some(
                  (brand) =>
                    brand.associated_domain &&
                    brand.associated_domain.some(
                      (d) => d.associated_url && d.associated_url.length > 0
                    )
                ) ? (
                  <div className="space-y-2">
                    {selectedResponse.identifiedBrands.map((brand) =>
                      brand.associated_domain?.map((domain) =>
                        domain.associated_url?.map((url, idx) => (
                          <div
                            key={`url-${brand._id}-${idx}`}
                            className="p-2 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                          >
                            <a
                              href={url.url_citation}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 truncate block"
                              title={url.url_citation}
                            >
                              {url.url_citation}
                            </a>
                            {url.url_anchor_text && (
                              <p className="text-xs text-gray-500 mt-1 truncate">
                                {url.url_anchor_text}
                              </p>
                            )}
                            {url.url_citation_type && (
                              <span className="inline-block px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded mt-1">
                                {url.url_citation_type}
                              </span>
                            )}
                          </div>
                        ))
                      )
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-3">
                    <span>No associated links</span>
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
