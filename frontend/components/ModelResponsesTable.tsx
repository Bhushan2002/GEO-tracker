"use client";
import { ModelResponseAPI } from "@/api/modelresponse.api";

import { ModelResponse } from "@/types";
import { useEffect, useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";
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
  useEffect(() => {
    ModelResponseAPI.getModelResponses().then((res) => {
      setModelRes(res.data);
    });
  }, []);


  return (
    <div>
      <div className="">
        <span className="pt-5 pl-4 text-2xl font-bold text-gray-600">Model Responses</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pl-4 pt-5 ">
        {modelRes.map((response) => (
          <Card key={response._id}>
            <CardHeader>
              <CardTitle >{response.modelName}</CardTitle>
              <CardDescription className="text-wrap line-clamp-2">{response.responseText?.trim()}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
