import {CirclePlus} from "lucide-react";
import SheetContainer from "@/components/SheetContainer";
import useSWR from "swr";
import {useEffect, useState} from "react";
function AddButton() {
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
        <form className="flex items-center w-full space-x-2">form</form>
      </SheetContainer>
    </>
  );
}

export default AddButton;
