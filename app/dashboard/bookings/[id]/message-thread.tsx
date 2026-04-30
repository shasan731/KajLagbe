"use client";
import { useFormState } from "react-dom";
import { sendMessageAction } from "@/app/actions/message";
import { SubmitButton } from "@/components/forms/submit-button";
import { formatDateTime } from "@/lib/dates";
import { useEffect, useRef } from "react";

type Msg = {
  id: string;
  message: string;
  attachmentUrl: string | null;
  createdAt: string;
  sender: { id: string; name: string };
};

export function MessageThread({
  bookingId,
  currentUserId,
  messages,
}: {
  bookingId: string;
  currentUserId: string;
  messages: Msg[];
}) {
  const [state, action] = useFormState<{ ok: boolean; error?: string }, FormData>(
    sendMessageAction,
    { ok: false, error: "" }
  );
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <div className="card p-5">
      <h2 className="font-semibold">Messages</h2>
      <div className="mt-3 max-h-80 overflow-y-auto space-y-2 border-t border-gray-100 pt-3">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-500">No messages yet.</p>
        ) : (
          messages.map((m) => {
            const mine = m.sender.id === currentUserId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    mine ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {!mine && <div className="text-xs font-semibold mb-0.5">{m.sender.name}</div>}
                  <div className="whitespace-pre-line">{m.message}</div>
                  {m.attachmentUrl && (
                    <a
                      href={m.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs underline mt-1 block opacity-90"
                    >
                      Attachment
                    </a>
                  )}
                  <div className={`text-[10px] mt-1 ${mine ? "text-white/80" : "text-gray-500"}`}>
                    {formatDateTime(m.createdAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <form ref={formRef} action={action} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start">
        <input type="hidden" name="bookingId" value={bookingId} />
        <textarea
          name="message"
          required
          rows={2}
          placeholder="Type a message"
          className="input min-w-0 flex-1"
        />
        <div className="flex w-full flex-col gap-1 sm:w-44">
          <input
            name="attachmentUrl"
            type="url"
            placeholder="Attachment URL"
            className="input w-full"
          />
          <SubmitButton>Send</SubmitButton>
        </div>
      </form>
      {!state.ok && state.error && (
        <p className="mt-2 text-sm text-red-700">{state.error}</p>
      )}
    </div>
  );
}
