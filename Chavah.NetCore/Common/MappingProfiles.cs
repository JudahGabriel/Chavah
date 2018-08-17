using BitShuva.Chavah.Models;

namespace AutoMapper.Mappings
{
    public class MappingProfiles : Profile
    {
        public MappingProfiles()
        {
            CreateMap<AppUser, UserViewModel>().ReverseMap();
        }
    }
}
