using Microsoft.AspNetCore.SignalR;

namespace LSevin.Api.Hubs
{
    public class ClientHub : Hub
    {
        // Called by the server when a new notification is created
        public async Task SendNotificationCount(string userId, int count)
        {
            await Clients.User(userId).SendAsync("ReceiveCount", count);
        }

        // Optional: let clients subscribe to their own group
        public async Task JoinUserGroup()
        {
            var userId = Context.User?.Identity?.Name;
            if (!string.IsNullOrEmpty(userId))
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, userId);
            }
        }

        public async Task LeaveUserGroup()
        {
            var userId = Context.User?.Identity?.Name;
            if (!string.IsNullOrEmpty(userId))
            {
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, userId);
            }
        }
    }
}
