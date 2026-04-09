"use client"
import React, { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import z from "zod/v3";

import { nodes } from "../../../../../../../components/blocks/editor-00/nodes";
import { BadgeCheck, Clock, Star, List } from 'lucide-react';
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
    const { setValue,resetField } = useFormContext();
  
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
    const [showAllProviders, setShowAllProviders] = useState(false)
    const [showAllServices, setShowAllServices] = useState(false)
    const [showAllSpecialists, setShowAllSpecialists] = useState(false)

    const refetchData=()=>{

    }
    const onServiceSelection=(service)=>{
      if(serviceId===service.id)
      {
        setValue('serviceId',undefined)
        // setValue('providerId',undefined)
        setValue('specialistId',undefined)
      }else{
        setValue('serviceId',service.id)
      }
      refetchData();
    }

    const onProviderSelection=(provider)=>{
      if(providerId===provider.id)
      {
        setValue('providerId',undefined)
        setValue('serviceId',undefined)
        setValue('specialistId',undefined)
      }else{
        setValue('providerId',provider.id)
      }
      refetchData();
    }

    const onSpecialistSelection=(doctor)=>{
      if(specialistId===doctor.id)
      {
        setValue('specialistId',undefined)

      }else{
        setValue('specialistId',doctor.id)
      }
      refetchData();
    }

    /* ----- Component maps ----- */
    const ChooseYourProvider = () => {
      return (
        <>
          {/* Select Service */}
          <div>
            <h2 className="mb-4 text-xl font-bold text-gray-900">
              Choose Your Provider
            </h2>
            <div className="space-y-3">
              {providers.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() =>{
                    onProviderSelection(provider)
                       
                  }}
                  className={`w-full overflow-hidden rounded-2xl border-2 bg-white transition-all ${
                    providerId === provider.id
                      ? "scale-[1.02] border-[#083f30] shadow-lg"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex gap-4 p-4">
                    <div className="relative flex-shrink-0">
                      <img
                        src={provider.image}
                        alt={provider.name}
                        className="h-24 w-24 rounded-xl object-cover"
                      />
                      {provider.popular && (
                        <div className="absolute -top-2 -right-2 rounded-lg bg-gradient-to-r from-[#eacb7f] to-[#d4b76a] px-2 py-1 text-xs font-bold text-[#083f30] shadow-md">
                          POPULAR
                        </div>
                      )}
                    </div>
  
                    <div className="flex-1 text-left">
                      <div className="mb-1 flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="mb-1 font-bold text-gray-900">
                            {provider.name}
                          </h3>
                          <p className="mb-2 text-sm text-gray-600">
                            {provider.description}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-600">
                            {/* <div className="flex items-center gap-1">
                                  <Clock size={14} />
                                  <span>{provider.duration}</span>
                                </div> */}
                            <span>•</span>
                            {/* <span className="px-2 py-0.5 bg-gray-100 rounded-md font-semibold">
                                  {provider.category}
                                </span> */}
                          </div>
                        </div>
  
                        <div className="ml-3 text-right">
                          {/* <div className="text-lg font-bold text-[#083f30]">
                                ${service.price}
                              </div> */}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      );
    };
    const SelectedProvider = () => {
      return (
        <>
          {/* Select Service */}
          <div>
            <h2 className="mb-4 text-xl font-bold text-gray-900">
              Selected Provider
            </h2>
            <div className="space-y-3">
              {providers.filter(f=> providerId === f.id).map((provider) => (
                <button
                  key={provider.id}
                  onClick={() =>{
                    onProviderSelection(provider)
                       
                  }}
                  className={`w-full overflow-hidden rounded-2xl border-2 bg-white transition-all ${
                    providerId === provider.id
                      ? "scale-[1.02] border-[#083f30] shadow-lg"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex gap-4 p-4">
                    <div className="relative flex-shrink-0">
                      <img
                        src={provider.image}
                        alt={provider.name}
                        className="h-24 w-24 rounded-xl object-cover"
                      />
                      {provider.popular && (
                        <div className="absolute -top-2 -right-2 rounded-lg bg-gradient-to-r from-[#eacb7f] to-[#d4b76a] px-2 py-1 text-xs font-bold text-[#083f30] shadow-md">
                          POPULAR
                        </div>
                      )}
                    </div>
  
                    <div className="flex-1 text-left">
                      <div className="mb-1 flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="mb-1 font-bold text-gray-900">
                            {provider.name}
                          </h3>
                          <p className="mb-2 text-sm text-gray-600">
                            {provider.description}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-600">
                            {/* <div className="flex items-center gap-1">
                                  <Clock size={14} />
                                  <span>{provider.duration}</span>
                                </div> */}
                            <span>•</span>
                            {/* <span className="px-2 py-0.5 bg-gray-100 rounded-md font-semibold">
                                  {provider.category}
                                </span> */}
                          </div>
                        </div>
  
                        <div className="ml-3 text-right">
                         {/* <div className="text-lg font-bold text-[#083f30]">
                                <List onClick={()=>setShowAllProviders(!showAllProviders)}/>
                              </div>  */}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              
            </div>
          </div>
        </>
      );
    };
    const ChooseYourService = () => {
      return (
        <>
          {/* Select Service */}
          <div>
            <h2 className="mb-4 text-xl font-bold text-gray-900">
              Choose Your Service
            </h2>
            <div className="space-y-3">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => onServiceSelection(service)}
                  className={`w-full overflow-hidden rounded-2xl border-2 bg-white transition-all ${
                    serviceId === service.id
                      ? "scale-[1.02] border-[#083f30] shadow-lg"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex gap-4 p-4">
                    <div className="relative flex-shrink-0">
                      <img
                        src={service.image}
                        alt={service.name}
                        className="h-24 w-24 rounded-xl object-cover"
                      />
                      {service.popular && (
                        <div className="absolute -top-2 -right-2 rounded-lg bg-gradient-to-r from-[#eacb7f] to-[#d4b76a] px-2 py-1 text-xs font-bold text-[#083f30] shadow-md">
                          POPULAR
                        </div>
                      )}
                    </div>
  
                    <div className="flex-1 text-left">
                      <div className="mb-1 flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="mb-1 font-bold text-gray-900">
                            {service.name}
                          </h3>
                          <p className="mb-2 text-sm text-gray-600">
                            {service.description}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock size={14} />
                              <span>{service.duration}</span>
                            </div>
                            <span>•</span>
                            <span className="rounded-md bg-gray-100 px-2 py-0.5 font-semibold">
                              {service.category}
                            </span>
                          </div>
                        </div>
  
                        <div className="ml-3 text-right">
                          <div className="text-lg font-bold text-[#083f30]">
                            ${service.price}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      );
    };


    const SelectedService = () => {
      return (
        <>
          {/* Select Service */}
          <div>
            <h2 className="mb-4 text-xl font-bold text-gray-900">
              Selected Service
            </h2>
            <div className="space-y-3">
              {services.filter(f=>serviceId === f.id).map((service) => (
                <button
                  key={service.id}
                  onClick={() => onServiceSelection(service)}
                  className={`w-full overflow-hidden rounded-2xl border-2 bg-white transition-all ${
                    serviceId === service.id
                      ? "scale-[1.02] border-[#083f30] shadow-lg"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex gap-4 p-4">
                    <div className="relative flex-shrink-0">
                      <img
                        src={service.image}
                        alt={service.name}
                        className="h-24 w-24 rounded-xl object-cover"
                      />
                      {service.popular && (
                        <div className="absolute -top-2 -right-2 rounded-lg bg-gradient-to-r from-[#eacb7f] to-[#d4b76a] px-2 py-1 text-xs font-bold text-[#083f30] shadow-md">
                          POPULAR
                        </div>
                      )}
                    </div>
  
                    <div className="flex-1 text-left">
                      <div className="mb-1 flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="mb-1 font-bold text-gray-900">
                            {service.name}
                          </h3>
                          <p className="mb-2 text-sm text-gray-600">
                            {service.description}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock size={14} />
                              <span>{service.duration}</span>
                            </div>
                            <span>•</span>
                            <span className="rounded-md bg-gray-100 px-2 py-0.5 font-semibold">
                              {service.category}
                            </span>
                          </div>
                        </div>
  
                        <div className="ml-3 text-right">
                          <div className="text-lg font-bold text-[#083f30]">
                            ${service.price}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      );
    };
    const ChooseYourSpecialist = () => {
      return (
        <>
          {/* Select Doctor */}
            <div>
              <h2 className="mb-4 text-xl font-bold text-gray-900">
                Choose Your Specialist
              </h2>
              <div className="space-y-3">
                {doctors.map((doctor) => (
                  <button
                    key={doctor.id}
                    onClick={() => 
                      
                      onSpecialistSelection(doctor)
                      }
                    className={`w-full rounded-2xl border-2 bg-white p-4 transition-all ${
                      specialistId === doctor.id
                        ? "border-[#083f30] shadow-md"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className="relative flex-shrink-0">
                        <img
                          src={doctor.image}
                          alt={doctor.name}
                          className="h-20 w-20 rounded-xl object-cover"
                        />
                        <div className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#083f30]">
                          <BadgeCheck size={14} className="text-[#eacb7f]" />
                        </div>
                      </div>
  
                      <div className="flex-1 text-left">
                        <h3 className="mb-1 font-bold text-gray-900">
                          {doctor.name}
                        </h3>
                        <p className="mb-2 text-sm text-gray-600">
                          {doctor.specialty}
                        </p>
  
                        <div className="mb-2 flex items-center gap-3 text-xs text-gray-600">
                          <span>{doctor.experience}</span>
                          <span>•</span>
                          <span>{doctor.patients} patients</span>
                        </div>
  
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Star
                              size={14}
                              className="fill-yellow-400 text-yellow-400"
                            />
                            <span className="text-sm font-bold text-gray-900">
                              {doctor.rating}
                            </span>
                          </div>
  
                          <span className="text-xs font-semibold text-[#083f30]">
                            Next: {doctor.nextAvailable}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
        </>
      );
    };

    const SelectedSpecialist = () => {
      return (
        <>
          {/* Select Doctor */}
            <div>
              <h2 className="mb-4 text-xl font-bold text-gray-900">
                Selected Specialist
              </h2>
              <div className="space-y-3">
                {doctors.filter(f=>specialistId === f.id).map((doctor) => (
                  <button
                    key={doctor.id}
                    onClick={() => onSpecialistSelection(doctor.id)}
                    
                    className={`w-full rounded-2xl border-2 bg-white p-4 transition-all ${
                      specialistId === doctor.id
                        ? "border-[#083f30] shadow-md"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className="relative flex-shrink-0">
                        <img
                          src={doctor.image}
                          alt={doctor.name}
                          className="h-20 w-20 rounded-xl object-cover"
                        />
                        <div className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#083f30]">
                          <BadgeCheck size={14} className="text-[#eacb7f]" />
                        </div>
                      </div>
  
                      <div className="flex-1 text-left">
                        <h3 className="mb-1 font-bold text-gray-900">
                          {doctor.name}
                        </h3>
                        <p className="mb-2 text-sm text-gray-600">
                          {doctor.specialty}
                        </p>
  
                        <div className="mb-2 flex items-center gap-3 text-xs text-gray-600">
                          <span>{doctor.experience}</span>
                          <span>•</span>
                          <span>{doctor.patients} patients</span>
                        </div>
  
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Star
                              size={14}
                              className="fill-yellow-400 text-yellow-400"
                            />
                            <span className="text-sm font-bold text-gray-900">
                              {doctor.rating}
                            </span>
                          </div>
  
                          <span className="text-xs font-semibold text-[#083f30]">
                            Next: {doctor.nextAvailable}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
        </>
      );
    };
  
    const edgeComponentMap = {
      [NodeType.Provider]: <ChooseYourProvider />,
      [NodeType.Service]: <ChooseYourService />,
      [NodeType.Specialist]: <ChooseYourSpecialist />,
    };
  
  
    const edgeComponentSelectedMap = {
      [NodeType.Provider]: <SelectedProvider />,
      [NodeType.Service]: <SelectedService />,
      [NodeType.Specialist]: <SelectedSpecialist />,
    };
  
    /* ----- Render ----- */
    if (!selectedNode) return <>please select a node</>;
  
    return (
      <div>
   
        {/* The selected node’s own component */}
        {/* {edgeComponentMap[selectedNode.name]} */}
  
        {/* All other nodes that are *not* selected */}
        {nodes
          .map(n => (
            <div key={n.name}>
              {n.isSelected && <>{edgeComponentSelectedMap[n.name]}</>}
              {!n.isSelected && <>{edgeComponentMap[n.name]}</>}
            </div>
          ))}
      </div>
    );
  }
  