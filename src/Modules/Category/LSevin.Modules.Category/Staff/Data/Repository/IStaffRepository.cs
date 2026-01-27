using BuildingBlocks.Core.Domain.Data;
using LSevin.Modules.Category.Staff.ValueObjects;

namespace LSevin.Modules.Category.Staff.Data.Repository;

public interface IStaffRepository : IRepository<Entities.Staff, StaffId>;
