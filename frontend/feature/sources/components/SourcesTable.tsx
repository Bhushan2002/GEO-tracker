"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
} from "lucide-react";
import { BadgeByType } from "./BadgeByType";
import { MentionsPopover } from "./MentionsPopover";

interface SourcesTableProps {
  activeTab: "domains" | "urls";
  filteredDomainData: any[];
  filteredUrlData: any[];
  mainBrand: any;
  brandLogoLookup: Record<string, string>;
  expandedDomain: string | null;
  setExpandedDomain: (domain: string | null) => void;
}

export function SourcesTable({
  activeTab,
  filteredDomainData,
  filteredUrlData,
  mainBrand,
  brandLogoLookup,
  expandedDomain,
  setExpandedDomain,
}: SourcesTableProps) {
  return (
    <div className="flex-1 overflow-auto custom-scrollbar">
      <table className="w-full text-sm text-left border-collapse table-fixed">
        <thead className="sticky top-0 bg-slate-50/80 backdrop-blur-md z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
          <tr className="h-11">
            <th className="w-12 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 px-4 border-r border-slate-200/50">
              #
            </th>
            <th className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-4 border-r border-slate-200/50">
              {activeTab === "domains" ? "Source" : "URL"}
            </th>
            <th className="w-32 text-[10px] font-bold uppercase tracking-widest text-slate-400 px-4 text-center border-r border-slate-200/50">
              {activeTab === "domains" ? "Domain Type" : "URL Type"}
            </th>
            {activeTab === "urls" && (
              <>
                <th className="w-28 text-[10px] font-bold uppercase tracking-widest text-slate-400 px-4 text-center border-r border-slate-200/50">
                  Mentioned
                </th>
                <th className="w-40 text-[10px] font-bold uppercase tracking-widest text-slate-400 px-4 text-center border-r border-slate-200/50">
                  Mentions
                </th>
              </>
            )}
            <th className="w-32 text-[10px] font-bold uppercase tracking-widest text-slate-400 px-4 text-center border-r border-slate-200/50">
              {activeTab === "domains" ? "Total Used" : "Used Total"}
            </th>
            <th className="w-32 text-[10px] font-bold uppercase tracking-widest text-slate-400 px-4 text-center">
              Avg. Citations
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {activeTab === "domains" ? (
            filteredDomainData.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-20 text-center text-slate-400 italic"
                >
                  No domains found
                </td>
              </tr>
            ) : (
              filteredDomainData.map((item, idx) => {
                const isExpanded = expandedDomain === item.domain;
                return (
                  <React.Fragment key={idx}>
                    <tr
                      onClick={() =>
                        setExpandedDomain(isExpanded ? null : item.domain)
                      }
                      className={cn(
                        "h-14 hover:bg-slate-50/50 transition-all duration-200 group cursor-pointer",
                        isExpanded && "bg-slate-50 border-l-2 border-l-slate-900"
                      )}
                    >
                      <td className="text-center text-slate-400 font-medium px-4 border-r border-slate-100">
                        {idx + 1}
                      </td>
                      <td className="px-4 border-r border-slate-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full border border-slate-100 flex items-center justify-center bg-white shrink-0 overflow-hidden shadow-sm">
                              <img
                                src={`https://logo.clearbit.com/${item.domain
                                  .replace(/^https?:\/\//, "")
                                  .split("/")[0]}`}
                                className="w-5 h-5 object-contain"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  const domain = item.domain
                                    .replace(/^https?:\/\//, "")
                                    .split("/")[0];
                                  if (!target.src.includes("google.com")) {
                                    target.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
                                  } else {
                                    target.style.display = "none";
                                    const parent = target.parentElement;
                                    if (parent) {
                                      parent.classList.add("bg-slate-50");
                                      parent.innerHTML = `<span class="text-[9px] font-bold text-slate-400 capitalize">${item.domain.charAt(
                                        0
                                      )}</span>`;
                                    }
                                  }
                                }}
                              />
                            </div>
                            <span className="font-bold text-slate-900">
                              {item.domain}
                            </span>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-900 transition-transform duration-300" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 text-center border-r border-slate-100">
                        <BadgeByType type={item.type} />
                      </td>
                      <td className="px-4 text-center font-bold text-slate-900 border-r border-slate-100">
                        {item.used}%
                      </td>
                      <td className="px-4 text-center text-slate-500 font-medium">
                        {item.avgCitations}
                      </td>
                    </tr>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <tr className="bg-slate-50/30 animate-in fade-in slide-in-from-top-2 duration-300">
                        <td />
                        <td colSpan={4} className="p-0">
                          <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-slate-400" />
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">
                                  CITED URLS ({item.urls.length})
                                </h4>
                              </div>
                              <p className="text-[10px] font-bold text-slate-400">
                                * Analytics based on total processed prompt runs
                              </p>
                            </div>

                            <div className="grid gap-3">
                              {item.urls.map((u: any, i: number) => (
                                <div
                                  key={i}
                                  className="group p-4 bg-white/60 hover:bg-white rounded-2xl border border-slate-100/50 hover:border-slate-200 transition-all duration-300 shadow-sm hover:shadow-md flex items-center justify-between gap-4"
                                >
                                  <div className="min-w-0 flex-1">
                                    <h5 className="font-bold text-slate-900 truncate mb-1 text-[13px]">
                                      {u.title}
                                    </h5>
                                    <a
                                      href={u.url}
                                      target="_blank"
                                      className="text-[11px] text-blue-500 hover:underline truncate opacity-80 flex items-center gap-1 w-fit"
                                    >
                                      {u.url}{" "}
                                      <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                                    </a>
                                  </div>
                                  <div className="flex items-center gap-8 shrink-0">
                                    <div className="text-right">
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">
                                        Coverage
                                      </p>
                                      <p className="text-[13px] font-black text-slate-900">
                                        {u.used}%
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">
                                        Avg Citations
                                      </p>
                                      <p className="text-[13px] font-black text-slate-900">
                                        {u.avgCitations}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {item.urls.length === 0 && (
                                <div className="text-center py-6 text-slate-400 italic text-xs">
                                  No specific landing pages mapped for this
                                  domain
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )
          ) : filteredUrlData.length === 0 ? (
            <tr>
              <td colSpan={7} className="p-20 text-center text-slate-400 italic">
                No URLs found
              </td>
            </tr>
          ) : (
            filteredUrlData.map((item, idx) => {
              const isMainBrandMentioned = mainBrand
                ? item.mentions.includes(mainBrand.brand_name)
                : false;
              return (
                <tr
                  key={idx}
                  className="h-14 hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="text-center text-slate-400 font-medium px-4 border-r border-slate-100">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-2 border-r border-slate-100">
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-9 h-9 rounded-full border border-slate-100 flex items-center justify-center bg-white shrink-0 overflow-hidden shadow-sm">
                        <img
                          src={`https://logo.clearbit.com/${
                            new URL(
                              item.url.startsWith("http")
                                ? item.url
                                : `https://${item.url}`
                            ).hostname
                          }`}
                          className="w-5 h-5 object-contain"
                          onError={(e) => {
                            const target = e.currentTarget;
                            try {
                              const hostname = new URL(
                                item.url.startsWith("http")
                                  ? item.url
                                  : `https://${item.url}`
                              ).hostname;
                              if (!target.src.includes("google.com")) {
                                target.src = `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
                              } else {
                                target.style.display = "none";
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.classList.add("bg-slate-50");
                                  const span = document.createElement("span");
                                  span.className =
                                    "text-[11px] font-bold text-slate-400 uppercase";
                                  span.innerText = item.title.charAt(0);
                                  parent.appendChild(span);
                                }
                              }
                            } catch (err) {
                              target.style.display = "none";
                            }
                          }}
                        />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span
                          className="font-bold text-slate-900 truncate"
                          title={item.title}
                        >
                          {item.title}
                        </span>
                        <a
                          href={item.url}
                          target="_blank"
                          className="text-[11px] text-blue-500 hover:underline truncate opacity-80 flex items-center gap-1 w-fit"
                        >
                          {item.url}{" "}
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 text-center border-r border-slate-100">
                    <BadgeByType type={item.type} isUrl />
                  </td>
                  <td className="px-4 text-center border-r border-slate-100">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                        isMainBrandMentioned
                          ? "bg-green-50 text-green-700 border-green-100"
                          : "bg-slate-50 text-slate-500 border-slate-200"
                      )}
                    >
                      {isMainBrandMentioned ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 text-center border-r border-slate-100">
                    <MentionsPopover
                      mentions={item.mentions}
                      logoLookup={brandLogoLookup}
                    />
                  </td>
                  <td className="px-4 text-center font-bold text-slate-900 border-r border-slate-100">
                    {item.usedTotal}
                  </td>
                  <td className="px-4 text-center text-slate-500 font-medium">
                    {item.avgCitations}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
