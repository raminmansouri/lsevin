"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import DatePicker from "@/components/form/date-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { AttributeFilterValue } from "@/features/home/types";
import type {
  AttributeOptionPublic,
  ProviderAttributeDefinition,
} from "@/features/provider-types/types/provider-type";

import { BY_TYPE_TRANSLATION_KEY } from "../../types/constants";

interface AttributeFiltersProps {
  attributes: ProviderAttributeDefinition[];
  selectedFilters: AttributeFilterValue[];
  onFilterAdd: (filter: AttributeFilterValue) => void;
  onFilterRemove: (attributeId: string, value: string) => void;
  onClearAll: () => void;
}

export function AttributeFilters({
  attributes,
  selectedFilters,
  onFilterAdd,
  onFilterRemove,
  onClearAll,
}: AttributeFiltersProps) {
  const t = useTranslations(`${BY_TYPE_TRANSLATION_KEY}.filters`);

  if (!attributes || attributes.length === 0) {
    return (
      <div className="text-muted-foreground py-4 text-center text-sm">
        {t("noFilters")}
      </div>
    );
  }

  const hasFilters = selectedFilters.length > 0;

  return (
    <div className="space-y-4">
      {/* Clear All Button */}
      {hasFilters && (
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">{t("activeFilters")}</Label>
          <Button variant="outline" size="icon" onClick={onClearAll}>
            <X className="size-4" />
          </Button>
        </div>
      )}

      {/* Active Filters Display */}
      {hasFilters && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {selectedFilters.map((filter, index) => {
              const attribute = attributes.find(
                (a) => a.id === filter.attributeDefinitionId
              );
              // Localize boolean values
              const displayValue =
                filter.value === "true"
                  ? t("booleanTrue")
                  : filter.value === "false"
                    ? t("booleanFalse")
                    : filter.value;
              return (
                <Badge
                  key={`${filter.attributeDefinitionId}-${filter.value}-${index}`}
                  variant="secondary"
                  className="gap-1"
                >
                  <span className="text-xs">
                    {attribute?.name}: {displayValue}
                  </span>
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() =>
                      onFilterRemove(filter.attributeDefinitionId, filter.value)
                    }
                  />
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Attribute Filters */}
      <div className="h-[calc(100vh-350px)] pt-4">
        <div className="space-y-2">
          {attributes.map((attribute, index) => (
            <div key={attribute.id}>
              <AttributeFilterItem
                attribute={attribute}
                selectedValues={selectedFilters
                  .filter((f) => f.attributeDefinitionId === attribute.id)
                  .map((f) => f.value)}
                onFilterAdd={(value) =>
                  onFilterAdd({ attributeDefinitionId: attribute.id, value })
                }
                onFilterRemove={(value) => onFilterRemove(attribute.id, value)}
              />
              {index < attributes.length - 1 && <Separator className="my-2" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface AttributeFilterItemProps {
  attribute: ProviderAttributeDefinition;
  selectedValues: string[];
  onFilterAdd: (value: string) => void;
  onFilterRemove: (value: string) => void;
}

function AttributeFilterItem({
  attribute,
  selectedValues,
  onFilterAdd,
  onFilterRemove,
}: AttributeFilterItemProps) {
  const t = useTranslations(`${BY_TYPE_TRANSLATION_KEY}.filters`);
  const [inputValue, setInputValue] = useState("");
  const [dateValue, setDateValue] = useState<string | undefined>(undefined);

  const handleTextNumberSubmit = () => {
    if (inputValue.trim()) {
      onFilterAdd(inputValue.trim());
      setInputValue("");
    }
  };

  const handleDateSubmit = () => {
    if (dateValue) {
      onFilterAdd(dateValue);
      setDateValue(undefined);
    }
  };

  const handleBooleanChange = (value: string) => {
    // For boolean filters, we support tri-state: "any", "true", "false"
    const currentValue = selectedValues[0]; // Boolean should only have one value

    // If same value clicked, do nothing
    if (currentValue === value) {
      return;
    }

    // Remove current value if exists
    if (currentValue) {
      onFilterRemove(currentValue);
    }

    // Add new value based on selection (skip if "any")
    // Use setTimeout to ensure removal completes before adding (handles React batching)
    if (value !== "any") {
      setTimeout(() => {
        onFilterAdd(value);
      }, 0);
    }
  };

  const handleSelectionToggle = (optionValue: string) => {
    if (selectedValues.includes(optionValue)) {
      onFilterRemove(optionValue);
    } else {
      onFilterAdd(optionValue);
    }
  };

  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="hover:bg-accent flex w-full justify-between p-2 text-sm"
        >
          <span className="font-medium">{attribute.name}</span>
          {selectedValues.length > 0 && (
            <Badge variant="default" className="ml-2">
              {selectedValues.length}
            </Badge>
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 p-2">
        {/* <p className="text-muted-foreground text-xs">{attribute.description}</p> */}

        {/* Text or Number Type */}
        {(attribute.attributeType === "Text" ||
          attribute.attributeType === "Number") && (
          <div className="flex gap-2">
            <Input
              type={attribute.attributeType === "Number" ? "number" : "text"}
              placeholder={`Enter ${attribute.name.toLowerCase()}`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleTextNumberSubmit();
                }
              }}
              className="text-sm"
            />
            {/* <Button size="sm" onClick={handleTextNumberSubmit}>
              Add
            </Button> */}
          </div>
        )}

        {/* DateTime Type */}
        {attribute.attributeType === "DateTime" && (
          <div className="space-y-2">
            <DatePicker
              value={dateValue}
              onChange={setDateValue}
              placeholder="Select date"
              className="w-full"
            />
            <Button
              size="sm"
              onClick={handleDateSubmit}
              disabled={!dateValue}
              className="w-full"
            >
              Add Date Filter
            </Button>
          </div>
        )}

        {/* Boolean Type */}
        {attribute.attributeType === "Boolean" && (
          <div className="space-y-2">
            <ToggleGroup
              type="single"
              value={
                selectedValues.includes("true")
                  ? "true"
                  : selectedValues.includes("false")
                    ? "false"
                    : "any"
              }
              onValueChange={handleBooleanChange}
              variant="outline"
              className="w-full justify-stretch"
            >
              <ToggleGroupItem
                value="any"
                aria-label={t("any")}
                className="flex-1"
              >
                {t("any")}
              </ToggleGroupItem>
              <ToggleGroupItem
                value="true"
                aria-label={t("yes")}
                className="flex-1"
              >
                {t("yes")}
              </ToggleGroupItem>
              <ToggleGroupItem
                value="false"
                aria-label={t("no")}
                className="flex-1"
              >
                {t("no")}
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        )}

        {/* Selection Type */}
        {attribute.attributeType === "Select" && attribute.options && (
          <div className="space-y-2">
            {attribute.options.map(
              (option: AttributeOptionPublic, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${attribute.id}-${option.value}`}
                    checked={selectedValues.includes(option.value)}
                    onCheckedChange={() => handleSelectionToggle(option.value)}
                  />
                  <Label
                    htmlFor={`${attribute.id}-${option.value}`}
                    className="text-sm font-normal"
                  >
                    {option.displayName}
                  </Label>
                </div>
              )
            )}
          </div>
        )}

        {/* Display selected values for this attribute */}
        {selectedValues.length > 0 &&
          attribute.attributeType !== "Boolean" &&
          attribute.attributeType !== "Select" && (
            <div className="mt-2 space-y-1">
              {selectedValues.map((value, index) => (
                <div
                  key={index}
                  className="bg-muted/20 flex items-center justify-between rounded p-1 text-xs"
                >
                  <span>{value}</span>
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => onFilterRemove(value)}
                  />
                </div>
              ))}
            </div>
          )}
      </CollapsibleContent>
    </Collapsible>
  );
}
