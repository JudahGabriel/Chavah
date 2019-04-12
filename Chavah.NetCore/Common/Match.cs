using System;
using System.Collections.Generic;
using System.Linq;

namespace BitShuva.Chavah.Common
{
    public static class Match
    {
        public static Match<T> Value<T>(T value)
        {
            return new Match<T>(value);
        }
    }

    public class Match<T>
    {
        private readonly T _value;

        public Match(T value)
        {
            _value = value;
        }

        public Match<T, TResult> With<TResult>(T otherValue, TResult result)
        {
            return new Match<T, TResult>(_value).With(otherValue, result);
        }

        public Match<T, TResult> With<TResult>(Func<T, bool> predicate, TResult result)
        {
            return new Match<T, TResult>(_value).With(predicate, result);
        }

        public Match<T, TResult> With<TResult>(Func<T, bool> predicate, Func<T, TResult> resultFetcher)
        {
            return new Match<T, TResult>(_value).With(predicate, resultFetcher);
        }

        /// <summary>
        /// Gets a property off of the object if it's not null or default.
        /// </summary>
        /// <typeparam name="TResult">The type of the result.</typeparam>
        /// <param name="propertyGetter">The function that fetches the property off the object.</param>
        /// <returns>The result.</returns>
        public TResult PropertyOrDefault<TResult>(Func<T, TResult> propertyGetter)
        {
            return new Match<T, TResult>(_value)
                .With(v => !EqualityComparer<T>.Default.Equals(v, default), propertyGetter)
                .DefaultTo(default(TResult))
                .Evaluate();
        }
    }

    public class Match<T, TResult>
    {
        private readonly T value;
        private readonly List<IMatchResult<T, TResult>> predicates = new List<IMatchResult<T, TResult>>();
        private TResult defaultValue;
        private Func<TResult> defaultValueFetcher;

        public Match(T value)
        {
            this.value = value;
        }

        public Match<T, TResult> With(T otherValue, TResult result)
        {
            predicates.Add(new ValueMatch<T, TResult>(otherValue, result));
            return this;
        }

        public Match<T, TResult> With(Func<T, bool> predicate, TResult result)
        {
            predicates.Add(new PredicateMatch<T, TResult>(predicate, result));
            return this;
        }

        public Match<T, TResult> With(Func<T, bool> predicate, Func<T, TResult> resultFetcher)
        {
            predicates.Add(new PredicateFetcherMatch<T, TResult>(predicate, resultFetcher));
            return this;
        }

        public Match<T, TResult> DefaultTo(TResult result)
        {
            defaultValue = result;
            return this;
        }

        public Match<T, TResult> DefaultTo(Func<TResult> resultFetcher)
        {
            defaultValueFetcher = resultFetcher;
            return this;
        }

        public TResult Evaluate()
        {
            return this;
        }

        public static implicit operator TResult(Match<T, TResult> match)
        {
            if (match == null)
            {
                return default;
            }

            var equality = EqualityComparer<T>.Default;
            var matchingPredicate = match.predicates.FirstOrDefault(p => p.Matches(match.value));
            if (matchingPredicate != null)
            {
                return matchingPredicate.Result(match.value);
            }

            return match.defaultValueFetcher != null ? match.defaultValueFetcher() : match.defaultValue;
        }
    }

    public interface IMatchResult<T, TResult>
    {
        bool Matches(T input);
        TResult Result(T input);
    }

    public class ValueMatch<T, TResult> : IMatchResult<T, TResult>
    {
        private readonly T value;
        private readonly TResult result;

        public ValueMatch(T value, TResult result)
        {
            this.value = value;
            this.result = result;
        }

        public bool Matches(T input)
        {
            return EqualityComparer<T>.Default.Equals(value, input);
        }

        public TResult Result(T input)
        {
            return result;
        }
    }

    public class PredicateMatch<T, TResult> : IMatchResult<T, TResult>
    {
        private readonly Func<T, bool> predicate;
        private readonly TResult result;

        public PredicateMatch(Func<T, bool> predicate, TResult result)
        {
            this.predicate = predicate;
            this.result = result;
        }

        public bool Matches(T input)
        {
            return predicate(input);
        }

        public TResult Result(T input)
        {
            return result;
        }
    }

    public class PredicateFetcherMatch<T, TResult> : IMatchResult<T, TResult>
    {
        private readonly Func<T, bool> predicate;
        private readonly Func<T, TResult> resultFetcher;

        public PredicateFetcherMatch(Func<T, bool> predicate, Func<T, TResult> fetcher)
        {
            this.predicate = predicate;
            resultFetcher = fetcher;
        }

        public bool Matches(T input)
        {
            return predicate(input);
        }

        public TResult Result(T input)
        {
            return resultFetcher(input);
        }
    }
}
