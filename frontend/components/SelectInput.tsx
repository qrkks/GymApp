import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {useState} from "react";
import authStore from "@/app/store/authStore";
import config from "@/utils/config";

interface SelectInputProps {
  placeholder: string;
  entries?: Array<{ id: number; name: string }>;
  mutate: () => void;
  onSelectChange?: (value: string) => void;
}

export default function SelectInput({
  placeholder,
  entries,
  mutate,
  onSelectChange,
}: SelectInputProps) {
  const {apiUrl} = config;
  const [selectValue, setSelectValue] = useState("");

  function handleValueChange(value: string) {
    if (value === "new") {
      const newEntry = prompt("请输入新建的部位：");
      if (newEntry) {
        fetch(`${apiUrl}/body-part`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": authStore.getCookieOrUndefined("csrftoken") || "",
          },
          body: JSON.stringify({
            name: newEntry,
          }),
        })
          .then((res) => res.json())
          .then(() => {
            mutate();
          });
      }
    } else {
      setSelectValue(value);
      onSelectChange && onSelectChange(value);
    }
  }

  return (
    <Select onValueChange={handleValueChange} value={selectValue}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{placeholder}</SelectLabel>
          {entries?.map((entry) => (
            <SelectItem key={entry.id} value={entry.name}>
              {entry.name}
            </SelectItem>
          ))}
          <SelectItem key="new" value="new">
            新建...
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

