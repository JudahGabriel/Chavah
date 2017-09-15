using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

// NOTE: this was written by Nils Lück as part of his Optional.Async library, which is not yet on NuGet.

namespace Optional.Async
{
    internal static class TaskTransformationExtensions
    {
        public static async Task<TResult> Map<TResult>(this Task task, Func<TResult> mapping)
        {
            await task.ConfigureAwait(AsyncOption.continueOnCapturedContext);
            return mapping();
        }

        public static async Task Map(this Task task, Action mapping)
        {
            await task.ConfigureAwait(AsyncOption.continueOnCapturedContext);
            mapping();
        }

        public static async Task<TResult> Map<T, TResult>(this Task<T> task, Func<T, TResult> mapping)
        {
            var value = await task.ConfigureAwait(AsyncOption.continueOnCapturedContext);
            return mapping(value);
        }

        public static async Task Map<T>(this Task<T> task, Action<T> mapping)
        {
            var value = await task.ConfigureAwait(AsyncOption.continueOnCapturedContext);
            mapping(value);
        }

        public static async Task FlatMap(this Task task, Func<Task> mapping)
        {
            await task.ConfigureAwait(AsyncOption.continueOnCapturedContext);
            await mapping().ConfigureAwait(AsyncOption.continueOnCapturedContext);
        }

        public static async Task<TResult> FlatMap<TResult>(this Task task, Func<Task<TResult>> mapping)
        {
            await task.ConfigureAwait(AsyncOption.continueOnCapturedContext);
            return await mapping().ConfigureAwait(AsyncOption.continueOnCapturedContext);
        }

        public static async Task FlatMap<T>(this Task<T> task, Func<T, Task> mapping)
        {
            var value = await task.ConfigureAwait(AsyncOption.continueOnCapturedContext);
            await mapping(value).ConfigureAwait(AsyncOption.continueOnCapturedContext);
        }

        public static async Task<TResult> FlatMap<T, TResult>(this Task<T> task, Func<T, Task<TResult>> mapping)
        {
            var value = await task.ConfigureAwait(AsyncOption.continueOnCapturedContext);
            return await mapping(value).ConfigureAwait(AsyncOption.continueOnCapturedContext);
        }
    }
}