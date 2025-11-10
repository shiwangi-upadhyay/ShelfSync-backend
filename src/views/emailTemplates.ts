
export const EmailTemplates = {
    welcomeUser: ({ name, email, password, role }: any) => ({
        subject: `Welcome to ShelfSync, ${name}!`,
        html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Welcome to ShelfSync, ${name} 👋</h2>
        <p>Your account has been created by the Super Admin.</p>
        <p><strong>Login Credentials:</strong></p>
        <ul>
          <li><b>Email:</b> ${email}</li>
          <li><b>Password:</b> ${password}</li>
          <li><b>Role:</b> ${role}</li>
        </ul>
        <p>Please log in and change your password immediately for security.</p>
        <br/>
        <p>Thank you,<br/><strong>The ShelfSync Team</strong></p>
      </div>
    `,
    }),

    taskAssigned: ({
        name,
        assignedBy,
        desc,
        teamName,
        startDate,
        endDate,
        priority,
    }: {
        name: string;
        assignedBy: string;
        desc: string;
        teamName: string;
        startDate?: string;
        endDate?: string;
        priority?: string;
    }) => ({
        subject: `New Task Assigned by ${assignedBy}`,
        html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Hello ${name},</h2>
        <p><strong>${assignedBy}</strong> assigned you a new task in <b>${teamName}</b>:</p>
        <blockquote style="border-left: 3px solid #4f46e5; padding-left: 10px;">
          ${desc}
        </blockquote>
        <p>
          <b>Priority:</b> ${priority || "Normal"}<br/>
          <b>Start:</b> ${startDate || "N/A"}<br/>
          <b>End:</b> ${endDate || "N/A"}
        </p>
        <p>Log in to ShelfSync to view details and update progress.</p>
        <br/>
        <p>— ShelfSync Team</p>
      </div>
    `,
    }),

    taskCompleted: ({
        name,
        completedBy,
        desc,
        teamName,
    }: {
        name: string;
        completedBy: string;
        desc: string;
        teamName: string;
    }) => ({
        subject: `Task Completed in ${teamName}`,
        html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Hey ${name},</h2>
        <p><strong>${completedBy}</strong> marked the task "<b>${desc}</b>" as completed in <b>${teamName}</b>.</p>
        <p>Check the task board for details and next steps.</p>
        <br/>
        <p>— ShelfSync Team</p>
      </div>
    `,
    }),
};
