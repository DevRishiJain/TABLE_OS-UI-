"use client";

import React, { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAiMenuQueryMutation } from "@/store/api/publicApi";
import { useAppDispatch } from "@/store";
import { addItem } from "@/store/slices/cartSlice";
import { addToast } from "@/store/slices/uiSlice";
import { formatMoney } from "@/lib/money";
import { Sparkles, Send, Plus, Check, Loader2, Bot } from "lucide-react";
import { MenuItem } from "@/types/domain";

export interface AIMenuSearchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId?: string;
  onSelectHighlightItem?: (item: MenuItem) => void;
}

const SAMPLE_QUERIES = [
  "What are your best spicy chicken dishes?",
  "Show me rich vegetarian curries and breads under ₹400",
  "Recommend a dessert to finish my meal",
  "What dishes are best for 2 people sharing?",
];

export const AIMenuSearchDrawer: React.FC<AIMenuSearchDrawerProps> = ({
  isOpen,
  onClose,
  restaurantId = process.env.NEXT_PUBLIC_DEFAULT_RESTAURANT_ID || "",
  onSelectHighlightItem,
}) => {
  const dispatch = useAppDispatch();
  const [query, setQuery] = useState("");
  const [aiMenuQuery, { isLoading }] = useAiMenuQueryMutation();

  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [retrievedItems, setRetrievedItems] = useState<MenuItem[]>([]);
  const [modelName, setModelName] = useState<string | null>(null);

  const handleAsk = async (textToSearch: string) => {
    const q = textToSearch.trim();
    if (!q) return;
    setAiAnswer(null);
    setRetrievedItems([]);

    try {
      const resp = await aiMenuQuery({
        restaurant_id: restaurantId,
        query: q,
      }).unwrap();

      if (resp?.retrieval) {
        setAiAnswer(resp.retrieval.answer);
        setRetrievedItems(resp.retrieval.retrieved_items || []);
        setModelName(resp.retrieval.model || "gemini-3.6-flash");
      }
    } catch (err) {
      console.error("AI query failed:", err);
      dispatch(
        addToast({
          type: "error",
          title: "AI Search Unavailable",
          message: "Failed to query the AI assistant. Please try again.",
        })
      );
    }
  };

  const handleAddToCart = (item: MenuItem) => {
    dispatch(addItem({ menuItem: item, quantity: 1 }));
    dispatch(
      addToast({
        type: "success",
        title: "Added to Cart",
        message: `${item.name} has been added to your dining order.`,
        durationMs: 2500,
      })
    );
    if (onSelectHighlightItem) {
      onSelectHighlightItem(item);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      position="bottom"
      title="AI Dining Concierge"
    >
      <div className="flex flex-col gap-5">
        {/* Intro */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-200">
              Powered by Google Gemini
            </h4>
            <p className="text-[11px] text-gray-300 leading-tight mt-0.5">
              Ask any question about flavors, ingredients, spice levels, or budget recommendations.
            </p>
          </div>
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk(query)}
            placeholder="Ask about dishes, tastes, budget..."
            leftIcon={<Bot className="w-4 h-4" />}
            className="text-sm"
          />
          <Button
            onClick={() => handleAsk(query)}
            isLoading={isLoading}
            disabled={!query.trim()}
            variant="gold"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Quick Suggestion Chips */}
        {!aiAnswer && !isLoading && (
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Popular Questions
            </span>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_QUERIES.map((sq, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQuery(sq);
                    handleAsk(sq);
                  }}
                  className="text-left text-xs bg-surface-subtle hover:bg-surface-hover border border-surface-border text-gray-300 hover:text-gray-100 px-3 py-2 rounded-xl transition-colors"
                >
                  {sq}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="py-8 flex flex-col items-center justify-center gap-3 text-center">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
            <p className="text-xs text-gray-400">
              Consulting the Spice Route kitchen catalog...
            </p>
          </div>
        )}

        {/* Answer Display */}
        {aiAnswer && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl bg-surface border border-surface-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-primary uppercase font-bold tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Recommendation
                </span>
                {modelName && (
                  <span className="text-[10px] font-mono text-gray-500">
                    {modelName}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-200 leading-relaxed">
                {aiAnswer}
              </p>
            </div>

            {/* Matched Dishes List */}
            {retrievedItems.length > 0 && (
              <div className="flex flex-col gap-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Recommended Menu Matches ({retrievedItems.length})
                </span>
                <div className="flex flex-col gap-2">
                  {retrievedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-surface border border-primary/30 hover:border-primary/60 transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-100">
                          {item.name}
                        </span>
                        <span className="text-xs text-primary font-semibold">
                          {formatMoney(item.price.amount_minor_units)}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="gold"
                        onClick={() => handleAddToCart(item)}
                        leftIcon={<Plus className="w-3.5 h-3.5" />}
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
};
