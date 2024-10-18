"use client";
import SelectInput from "@/components/SelectInput";
import SheetContainer from "@/components/SheetContainer";
import {useState} from "react";
import useSWR from "swr";
import {Button} from "@/components/ui/button";
import authStore from "@/app/store/authStore";

function StartBodyPart({date, mutateWorkout}) {
  const [selectedValue, setSelectedValue] = useState(null);

  const fetcher = (url) =>
    fetch(url, {credentials: "include"}).then((res) => res.json());
  const {
    data: bodyPartsDataForSelect,
    error: bodyPartsError,
    mutate: mutateBodyParts,
  } = useSWR("http://127.0.0.1:8000/api/bodypart", fetcher);

  if (bodyPartsError) return <div>Failed to load data</div>;

  function handleSubmit() {
    console.log("selectedValue", selectedValue);

    if (!selectedValue) {
      console.error("No body part selected");
      return;
    }

    fetch(`http://127.0.0.1:8000/api/workout/add-body-parts/${date}`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": authStore.getCookie("csrftoken"),
      },
      body: JSON.stringify({body_part_names: [selectedValue]}),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("api response:", data);
      })
      .then(() => {
        mutateWorkout();
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  return (
    <>
      <SheetContainer
        title="选择训练部位"
        description="选择今天的训练部位"
        triggerButton={<Button>添加训练部位</Button>}
        submitButtonText="确定"
        onHandleSubmit={handleSubmit}
      >
        <form className="flex items-center w-full space-x-2">
          <SelectInput
            className="w-2/3"
            placeholder="训练部位"
            name="body_part"
            entries={bodyPartsDataForSelect || []}
            mutate={mutateBodyParts}
            onSelectChange={setSelectedValue}
          />
        </form>
      </SheetContainer>
    </>
  );
}

export default StartBodyPart;

// 这一页的逻辑是一个前端 React 组件，用于在一个训练应用中让用户选择和提交当天的训练部位。它通过与后端 API 通信，获取可用的训练部位列表，并将选中的训练部位提交到服务器端，更新当天的训练数据。具体来说，核心逻辑可以分为几个部分：

// ### 1. **`useSWR` 数据获取：**
// 组件使用 `useSWR`（一个用于数据请求的 hook）从后端 API（`http://127.0.0.1:8000/api/bodypart`）获取训练部位的列表数据。`SWR` 是一个用于处理数据请求、缓存、重新验证等功能的库。

// - `fetcher`：通过这个函数从 API 获取数据，返回 JSON 格式的数据。
// - `bodyPartsDataForSelect`：这是获取到的训练部位数据，传递给组件以供选择。
// - `bodyPartsError`：如果请求出错，页面会显示错误提示 "Failed to load data"。

// ### 2. **`useState` 状态管理：**
// 组件使用 `useState` 来管理用户选中的训练部位（`selectedValue`）。当用户选择了某个训练部位时，状态会更新。

// - `setSelectedValue`：当用户在选择框中选择了一个训练部位时，触发这个方法来更新状态。

// ### 3. **选择训练部位的表单 (`SelectInput`)：**
// `SelectInput` 是一个自定义组件，允许用户从获取到的训练部位列表中选择一个训练部位。用户选择的训练部位会更新 `selectedValue`，用以提交。

// - `entries={bodyPartsDataForSelect || []}`：将从 API 获取的训练部位数据传递给 `SelectInput`，用于显示。
// - `onSelectChange={setSelectedValue}`：当用户选择时，更新状态。

// ### 4. **表单提交逻辑：**
// 当用户点击"确定"按钮时，表单会提交选中的训练部位。

// - **`handleSubmit` 函数：**
//   - 检查 `selectedValue` 是否为空，如果为空则返回并给出错误提示。
//   - 如果有选中的训练部位，发起 `PUT` 请求到后端 API（`http://127.0.0.1:8000/api/workout/add-body-parts/${date}`），提交选中的训练部位数据。
//   - `body`：请求体为一个 JSON 数据，包含选中的训练部位名。
//   - 提交后，成功处理 API 响应并刷新当前 Workout 数据（通过调用 `mutateWorkout`）。

// ### 5. **SheetContainer 组件：**
// 这个自定义组件包裹了表单，包含标题、描述、触发按钮（“添加训练部位”）和提交按钮（“确定”）。当用户点击“添加训练部位”按钮时，触发表单显示，用户可以选择并提交训练部位。

// - `triggerButton={<Button>添加训练部位</Button>}`：这是用于触发弹出表单的按钮。
// - `onHandleSubmit={handleSubmit}`：当用户点击"确定"按钮时，调用 `handleSubmit` 提交表单。

// ### 6. **`mutateWorkout`**：
// 这个函数传递给了 `StartBodyPart` 组件，用于在成功提交训练部位后，刷新当天的 Workout 数据。它利用 `SWR` 的机制，让 UI 反映出最新的后端数据。

// ---

// ### 总体逻辑：
// 1. 从后端 API 获取训练部位数据。
// 2. 用户选择一个训练部位并提交。
// 3. 提交后，将选中的部位更新到后台 API，并更新当前 Workout 数据。
