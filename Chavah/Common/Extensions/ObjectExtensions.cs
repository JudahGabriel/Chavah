using System.Linq;
using System.Reflection;

namespace BitShuva.Chavah.Common
{
    public static class ObjectExtensions
    {
        public static TDestination CopyPropsFrom<TSource, TDestination>(this TDestination destination, TSource source)
        {
            var sourceProperties = typeof(TSource)
                .GetProperties(BindingFlags.Public | BindingFlags.Instance)
                .Where(p => p.CanRead);
            var targetProperties = typeof(TDestination)
                .GetProperties(BindingFlags.Public | BindingFlags.Instance)
                .Where(p => p.CanWrite);
            foreach (var sourceProp in sourceProperties)
            {
                var destProp = targetProperties.FirstOrDefault(p => p.Name == sourceProp.Name);
                if (destProp != null)
                {
                    var sourceValue = sourceProp.GetValue(source);
                    destProp.SetValue(destination, sourceValue);
                }
            }

            return destination;
        }
    }
}