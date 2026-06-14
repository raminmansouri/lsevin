import { useQueryState } from "nuqs";

export type ProfileTab = "basic" | "additional" | "documents";

export function useProfileTabs() {
  const [activeTab, setActiveTab] = useQueryState("tab", {
    defaultValue: "basic" as ProfileTab,
    parse: (value): ProfileTab => {
      const parsedValue = value as ProfileTab;
      return parsedValue === "basic" ||
        parsedValue === "additional" ||
        parsedValue === "documents"
        ? parsedValue
        : "basic";
    },
    serialize: (value) => value,
  });

  const handleTabChange = async (newTab: ProfileTab) => {
    await setActiveTab(newTab);
  };

  return {
    activeTab: activeTab ?? "basic",
    setActiveTab: handleTabChange,
  };
}
