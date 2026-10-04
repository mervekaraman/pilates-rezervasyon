"use client";

import { createContext, useContext, useMemo, useState } from "react";

type RequestState = Record<string, "pending" | "approved" | "rejected">;
type BookingStatus = "pending" | "approved" | "cancelled";
type FlowlyState = {
  favorites: string[];
  toggleFavorite: (id: string) => void;
  selectedDay: string;
  setSelectedDay: (day: string) => void;
  selectedTime: string;
  setSelectedTime: (time: string) => void;
  bookingCreated: boolean;
  setBookingCreated: (value: boolean) => void;
  bookingStatus: BookingStatus;
  setBookingStatus: (value: BookingStatus) => void;
  requestStates: RequestState;
  setRequestState: (id: string, state: RequestState[string]) => void;
  notificationsRead: boolean;
  setNotificationsRead: (value: boolean) => void;
  publishedClass: boolean;
  setPublishedClass: (value: boolean) => void;
};

const FlowlyContext = createContext<FlowlyState | null>(null);

export function FlowlyProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState(["move", "studio-11", "balance"]);
  const [selectedDay, setSelectedDay] = useState("4");
  const [selectedTime, setSelectedTime] = useState("18:30");
  const [bookingCreated, setBookingCreated] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>("approved");
  const [requestStates, setRequestStates] = useState<RequestState>({ selin: "pending", merve: "pending", ceren: "pending" });
  const [notificationsRead, setNotificationsRead] = useState(false);
  const [publishedClass, setPublishedClass] = useState(false);

  const value = useMemo<FlowlyState>(() => ({
    favorites,
    toggleFavorite: (id) => setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]),
    selectedDay,
    setSelectedDay,
    selectedTime,
    setSelectedTime,
    bookingCreated,
    setBookingCreated,
    bookingStatus,
    setBookingStatus,
    requestStates,
    setRequestState: (id, state) => {
      setRequestStates((current) => ({ ...current, [id]: state }));
      if (bookingCreated && state === "approved") setBookingStatus("approved");
    },
    notificationsRead,
    setNotificationsRead,
    publishedClass,
    setPublishedClass,
  }), [favorites, selectedDay, selectedTime, bookingCreated, bookingStatus, requestStates, notificationsRead, publishedClass]);

  return <FlowlyContext.Provider value={value}>{children}</FlowlyContext.Provider>;
}

export function useFlowly() {
  const context = useContext(FlowlyContext);
  if (!context) throw new Error("useFlowly must be used inside FlowlyProvider");
  return context;
}
