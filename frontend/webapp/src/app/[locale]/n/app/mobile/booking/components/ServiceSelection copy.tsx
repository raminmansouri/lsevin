"use client"
import React, { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import z from "zod/v3";

import { nodes } from "../../../../../../../components/blocks/editor-00/nodes";
import { BadgeCheck, Clock, Star } from "lucide-react";
import { BookingFormValues } from "../types";

  const services = [
    {
      id: "hair-treatment",
      name: "Keratin Hair Treatment",
      description: "Professional smoothing treatment",
      duration: "2.5 hours",
      price: 180,
      category: "Hair Care",
      popular: true,
      image:
        "/unsplash_images/photo-1560066984-138dadb4c035__w=400&h=300&fit=crop.jpg",
    },
    {
      id: "spa-facial",
      name: "Luxury Facial Spa",
      description: "Deep cleansing and rejuvenation",
      duration: "90 min",
      price: 120,
      category: "Facial",
      popular: true,
      image:
        "/unsplash_images/photo-1570172619644-dfd03ed5d881__w=400&h=300&fit=crop.jpg",
    },
    {
      id: "manicure-pedicure",
      name: "Premium Manicure & Pedicure",
      description: "Complete nail care package",
      duration: "60 min",
      price: 85,
      category: "Nails",
      image:
        "/unsplash_images/photo-1604654894610-df63bc536371__w=400&h=300&fit=crop.jpg",
    },
  ];

  const providers = [
    {
      id: "1",
      name: "Istanbul Medical Center",
      description: "Istanbul Medical Center",
      rating: 4.9,
      verified: true,
      popular: true,
      image:
        "/unsplash_images/photo-1519494026892-80bbd2d6fd0d__w=200&h=200&fit=crop.jpg",
    },
    {
      id: "2",

      name: "Dubai Smile Clinic",
      description: "Dubai Smile Clinic",
      rating: 4.9,
      popular: true,
      verified: true,
      image:
        "/unsplash_images/photo-1629909613654-28e377c37b09__w=200&h=200&fit=crop.jpg",
    },
    {
      id: "3",

      popular: true,
      name: "Bali Wellness Resort",
      description: "Bali Wellness Resort",
      rating: 5.0,
      verified: true,
      image:
        "/unsplash_images/photo-1540555700478-4be289fbecef__w=200&h=200&fit=crop.jpg",
    },
    {
      id: "4",

      name: "Cyprus Fertility Center",
      description: "Cyprus Fertility Center",
      rating: 4.8,
      popular: true,
      verified: true,
      image:
        "/unsplash_images/photo-1551190822-a9333d879b1f__w=200&h=200&fit=crop.jpg",
    },
  ];

   const doctors = [
    {
      id: '1',
      name: 'Dr. Mehmet Yavuz',
      specialty: 'Hair Transplant Surgeon',
      experience: '18 years',
      rating: 4.9,
      reviews: 1247,
      patients: '12,000+',
      languages: ['English', 'Turkish', 'Arabic'],
      credentials: ['MD', 'ISHRS Member', 'Board Certified'],
      verified: true,
      consultation: 0,
      image: '/unsplash_images/photo-1612349317150-e413f6a5b16d__w=400&h=400&fit=crop.jpg',
      nextAvailable: 'Mar 15, 2026'
    },
    {
      id: '2',
      name: 'Dr. Can Ozturk',
      specialty: 'Hair Restoration Expert',
      experience: '15 years',
      rating: 4.8,
      reviews: 892,
      patients: '10,500+',
      languages: ['English', 'Turkish', 'German'],
      credentials: ['MD', 'FUE Specialist', 'ABHRS'],
      verified: true,
      consultation: 0,
      image: '/unsplash_images/photo-1622253692010-333f2da6031d__w=400&h=400&fit=crop.jpg',
      nextAvailable: 'Mar 12, 2026'
    },
  ];


  import {  useWatch } from 'react-hook-form';
  import { useMemo } from 'react';
  
  /* ----- Types & Enums ----- */
  interface INode {
    name: NodeType;
    edges: NodeType[];
    isSelected: boolean; // we only need a boolean in the UI
  }
  
  enum NodeType {
    Provider,
    Service,
    Specialist,
  }
  

  /* ----- Main component ----- */
  export default function ServiceSelection() {
    /* 1️⃣  Grab the form context */
    const { setValue } = useFormContext();
  
    /* 2️⃣  Watch the three id fields */
    const providerId = useWatch({ name: 'providerId' });
    const serviceId   = useWatch({ name: 'serviceId' });
    const specialistId = useWatch({ name: 'specialistId' });
  
    /* 3️⃣  Build the node graph each time a watched value changes */
    const nodes = useMemo<INode[]>(() => [
      {
        name: NodeType.Provider,
        edges: [NodeType.Service, NodeType.Specialist],
        isSelected: !!providerId,
      },
      {
        name: NodeType.Service,
        edges: [NodeType.Provider, NodeType.Specialist],
        isSelected: !!serviceId,
      },
      {
        name: NodeType.Specialist,
        edges: [NodeType.Service, NodeType.Provider],
        isSelected: !!specialistId,
      },
    ], [providerId, serviceId, specialistId]);
  
    /* 4️⃣  Pick the node that is currently selected (or first one if none) */
    const selectedNode = useMemo(() => nodes.find(n => n.isSelected) ?? nodes[0], [nodes]);
  
    /* ----- Component maps ----- */
    const ChooseYourProvider = () => (
      <>
        <h2 className="mb-4 text-xl font-bold text-gray-900">
          Choose Your Provider
        </h2>
        <div className="space-y-3">
          {providers.map(provider => (
            <button
              key={provider.id}
              type="button"
              onClick={() => {
                setValue('providerId', provider.id);
              }}
              className={`w-full overflow-hidden rounded-2xl border-2 bg-white transition-all ${
                providerId === provider.id
                  ? 'scale-[1.02] border-[#083f30] shadow-lg'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* button contents (image, text, …) */}
            </button>
          ))}
        </div>
      </>
    );
  
    const ChooseYourService = () => (
      <>
        <h2 className="mb-4 text-xl font-bold text-gray-900">
          Choose Your Service
        </h2>
        <div className="space-y-3">
          {services.map(service => (
            <button
              key={service.id}
              type="button"
              onClick={() => setValue('serviceId', service.id)}
              className={`w-full overflow-hidden rounded-2xl border-2 bg-white transition-all ${
                serviceId === service.id
                  ? 'scale-[1.02] border-[#083f30] shadow-lg'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* button contents */}
            </button>
          ))}
        </div>
      </>
    );
  
    const ChooseYourSpecialist = () => (
      <>
        <h2 className="mb-4 text-xl font-bold text-gray-900">
          Choose Your Specialist
        </h2>
        <div className="space-y-3">
          {doctors.map(doctor => (
            <button
              key={doctor.id}
              type="button"
              onClick={() => setValue('specialistId', doctor.id)}
              className={`w-full rounded-2xl border-2 bg-white p-4 transition-all ${
                specialistId === doctor.id
                  ? 'border-[#083f30] shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* button contents */}
            </button>
          ))}
        </div>
      </>
    );
  
    const edgeComponentMap = {
      [NodeType.Provider]: <ChooseYourProvider />,
      [NodeType.Service]: <ChooseYourService />,
      [NodeType.Specialist]: <ChooseYourSpecialist />,
    };
  
    /* ----- Render ----- */
    if (!selectedNode) return <>please select a node</>;
  
    return (
      <div>
        {/* The selected node’s own component */}
        {edgeComponentMap[selectedNode.name]}
  
        {/* All other nodes that are *not* selected */}
        {nodes
          .filter(n => !n.isSelected)
          .map(n => (
            <div key={n.name}>{edgeComponentMap[n.name]}</div>
          ))}
      </div>
    );
  }
  