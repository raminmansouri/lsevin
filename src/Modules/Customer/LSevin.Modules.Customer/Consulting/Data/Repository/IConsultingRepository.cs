using BuildingBlocks.Core.Domain.Data;
using LSevin.Modules.Customer.Consulting.ValueObjects;
using ConsultingDomain = LSevin.Modules.Customer.Consulting.Entities.Consulting;

namespace LSevin.Modules.Customer.Consulting.Data.Repository;

public interface IConsultingRepository : IRepository<ConsultingDomain, ConsultingId>;
