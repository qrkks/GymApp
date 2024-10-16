import {CirclePlus} from "lucide-react";
import SheetContainer from "@/components/SheetContainer";
import useSWR from "swr";
import {use, useEffect, useState} from "react";
import {Input} from "@/components/ui/input";

function AddButton() {
  const [formData, setFormData] = useState({
    weight: "",
    reps: "",
  });

  function handleChange(event) {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  }

  useEffect(() => {
    console.log("formData", formData);
  }, [formData]);

  return (
    <>
      <SheetContainer
        title="添加训练组"
        description="添加训练组"
        triggerButton={
          <button>
            <CirclePlus className="w-4 text-gray-400" />
          </button>
        }
        submitButtonText="确定"
      >
        <form className="flex flex-col items-center justify-center w-full gap-2">
          <Input
            name="weight"
            type="number"
            min="0"
            placeholder="Weight"
            value={formData.weight || ""}
            onChange={handleChange}
          />
          <Input
            name="reps"
            type="number"
            min="0"
            placeholder="Reps"
            value={formData.reps || ""}
            onChange={handleChange}
          />
        </form>
      </SheetContainer>
    </>
  );
}

export default AddButton;
