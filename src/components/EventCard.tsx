"use client"; // 1. 因為這會有按鈕互動，必須是 Client Component

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, CheckCircle2, Circle } from "lucide-react"; // 漂亮的圖示

// 定義這個元件需要什麼資料
type EventCardProps = {
  id: number;
  title: string;
  startDate: string; // 從後端傳過來會是字串
  endDate: string;
  hostName: string;
  participantsCount: number;
  isJoined: boolean; // 最重要的狀態：我參加了嗎？
  currentUserHandle: string; // 知道是誰在操作
  currentUserDisplayName?: string;
};

export default function EventCard({
  id,
  title,
  startDate,
  endDate,
  hostName,
  participantsCount,
  isJoined: initialIsJoined, // 重新命名為 initial... 因為我們要用 state 控制它
  currentUserHandle,
  currentUserDisplayName,
}: EventCardProps) {
  const router = useRouter(); // 用來重新整理頁面
  
  // 2. 本地狀態：記錄現在是不是參加中，還有參加人數
  const [joined, setJoined] = useState(initialIsJoined);
  const [count, setCount] = useState(participantsCount);
  const [loading, setLoading] = useState(false);

  // 3. 處理「參加/退出」按鈕點擊
  const handleToggleJoin = async (e: React.MouseEvent) => {
    e.preventDefault(); // 防止點擊連結跳轉（因為我們還會把整張卡片變成連結）
    e.stopPropagation();

    if (loading) return;
    setLoading(true);

    try {
      if (joined) {
        // 如果原本是參加 -> 呼叫 DELETE API 退出
        await fetch(`/api/events/${id}/join`, {
          method: "DELETE",
          body: JSON.stringify({ userHandle: currentUserHandle }),
        });
        setCount((prev) => prev - 1);
      } else {
        // 如果原本沒參加 -> 呼叫 POST API 參加
        await fetch(`/api/events/${id}/join`, {
          method: "POST",
          body: JSON.stringify({ userHandle: currentUserHandle }),
        });
        setCount((prev) => prev + 1);
      }
      setJoined(!joined); // 切換狀態
      router.refresh(); // 通知 Next.js 重新整理伺服器資料（sync）
    } catch (error) {
      console.error("Failed to toggle join status", error);
      alert("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  // 格式化時間字串
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const timeString = date.toLocaleString("en-US", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `${timeString} ${date.getHours() >= 12 ? "PM" : "AM"}`;
  };

  return (
    // 卡片本體是連結，點了去詳情頁
    <Link 
      href={`/event/${id}?username=${encodeURIComponent(currentUserDisplayName || currentUserHandle)}&handle=${currentUserHandle}`}
      className="block w-full"
    >
      <div className="flex w-full flex-col gap-2 rounded-lg border p-4 hover:bg-slate-50 transition-colors">
        <div className="flex justify-between items-start">
          {/* 左邊：活動資訊 */}
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <span className="text-sm text-slate-500">
              {formatDate(startDate)} ~ {formatDate(endDate)}
            </span>
            <span className="text-sm text-blue-600 font-medium">@{hostName}</span>
          </div>

          {/* 右邊：參加按鈕 (這是一個獨立的按鈕區域) */}
          <button
            onClick={handleToggleJoin}
            disabled={loading}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all
              ${joined 
                ? "bg-green-100 text-green-700 hover:bg-green-200" 
                : "bg-slate-100 text-slate-600 hover:bg-slate-200" 
              }`}
          >
            {/* 根據狀態顯示不同 Icon */}
            {joined ? <CheckCircle2 size={18} /> : <Circle size={18} />}
            {joined ? "Attended" : "Join"}
          </button>
        </div>

        {/* 底部：統計資訊 */}
        <div className="mt-2 flex items-center gap-1 text-slate-500 text-sm">
          <Users size={16} />
          <span>{count} people attending </span>
        </div>
      </div>
    </Link>
  );
}