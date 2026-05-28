import React from 'react';
import { useTranslations } from "next-intl";
export default function BookingSteps() {
    const tBooking = useTranslations("Booking");
    return (<div>{tBooking("bookingSteps")}</div>);
}
