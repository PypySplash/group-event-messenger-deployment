"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

// 引用 shadcn/ui 的組件
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type AddEventDialogProps = {
  userHandle: string; // 我們需要知道是誰在新增
};

export default function AddEventDialog({ userHandle }: AddEventDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false); // 控制對話框開關

  // 表單資料
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // 簡單的前端驗證
    if (!title || !startDate || !endDate) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    try {
      // 確保使用者 handle 存在
      if (!userHandle) {
         setError("User information is incomplete, please log in again");
         setLoading(false);
         return;
      }

      console.log("Sending event data:", {
          title,
          description,
          startDate: new Date(startDate).toISOString(), 
          endDate: new Date(endDate).toISOString(),
          handle: userHandle,
      });

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          startDate: new Date(startDate).toISOString(), 
          endDate: new Date(endDate).toISOString(),
          handle: userHandle,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        console.error("API Error:", data);
        let errorMessage = "Failed to create event";
        if (typeof data.error === "string") {
            errorMessage = data.error;
        } else if (Array.isArray(data.error)) {
            // Zod error array
            errorMessage = data.error.map((e: any) => e.message).join(", ");
        }
        throw new Error(errorMessage);
      }

      // 成功後：關閉視窗 -> 重整頁面 -> 清空表單
      setOpen(false);
      router.refresh();
      setTitle("");
      setDescription("");
      setStartDate("");
      setEndDate("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* 這就是那個觸發按鈕 */}
        <Button className="rounded-full shadow-lg">
          <Plus className="mr-2 h-4 w-4" /> Add Event
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle> Create New Event </DialogTitle>
          <DialogDescription>
            Fill in the event details to gather people!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {error && (
            <div className="text-red-500 text-sm font-medium">{error}</div>
          )}
          
          <div className="grid gap-2">
            <Label htmlFor="title"> Event Title </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Friday night badminton"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="desc"> Event Description (Optional) </Label>
            <Input
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Location, cost, notes..."
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="grid gap-2 flex-1">
              <Label htmlFor="start"> Start Time </Label>
              <Input
                id="start"
                type="datetime-local" // 這是瀏覽器內建的時間選擇器
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2 flex-1">
              <Label htmlFor="end"> End Time </Label>
              <Input
                id="end"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}